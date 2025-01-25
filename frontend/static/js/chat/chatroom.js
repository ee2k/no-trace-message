import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';

class ChatRoom {
    constructor() {
        // Initialize global features
        initSvgIcons();
        
        // Initialize chat features
        this.ws = null;
        this.roomId = null;
        this.username = null;
        this.token = null;
        this.participantCount = 0;
        this.messageInput = $('#messageInput');
        this.messages = $('#messages');
        this.shareDialog = $('#shareDialog');
        this.menuBtn = $('#menuBtn');
        this.menuDropdown = $('#menuDropdown');
        this.plusBtn = $('#plusBtn');
        this.plusMenu = $('#plusMenu');
        this.MAX_MESSAGE_LENGTH = 2000;
        this.messageQueue = [];
        this.isConnected = false;
        this.pingInterval = null;
        this.lastPong = null;
        this.pendingMessages = new Map();
        this.messageCounter = 0;
        this.messageTimestamps = [];
        this.RATE_LIMIT = 5; // Max 10 messages per 10 seconds
        this.RATE_LIMIT_WINDOW = 10000; // 10 second window
        this.connectionQuality = 'disconnected';
        this.allowedOrigins = new Set([
            window.location.origin,
            // Add other allowed origins here
        ]);
        this.MAX_TEXT_LENGTH = 2000; // Characters
        this.MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
        this.hasSentFirstMessage = false; // Track if first message has been sent
        this.reconnectAttempts = 0; // Track reconnection attempts
        this.reconnectTimeout = null; // Track reconnection timeout
        this.RECONNECT_BASE_DELAY = 1000; // Base delay for reconnection (1 second)
        this.MAX_RECONNECT_DELAY = 6000; // Max delay for reconnection (6 seconds)
        
        this.setupMenu();
        this.setupMessageInput();
        this.setupPlusMenu();

        // Create and insert character counter
        this.charCounter = document.createElement('div');
        this.charCounter.className = 'char-counter';
        this.charCounter.style.display = 'none';
        $('.chat-input').append(this.charCounter);

        this.statusIcon = document.createElement('div');
        this.statusIcon.className = 'status-icon';
        $('#roomStatus').appendChild(this.statusIcon);
        this.currentStatus = null; // Track the current status
    }

    async connect() {
        try {
            // Get room ID from URL path
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            this.roomId = pathParts[pathParts.length - 1];
            
            // Get token from sessionStorage
            this.token = sessionStorage.getItem(`room_token_${this.roomId}`) || undefined;

            // Connect to WebSocket
            this.connectWebSocket();

            // Wait for WebSocket to open
            await new Promise((resolve, reject) => {
                this.ws.onopen = resolve;
                this.ws.onerror = reject;
            });

            // The backend will now handle user authentication and ID assignment
            // We'll receive the user ID through the WebSocket connection
        } catch (error) {
            console.error('Error connecting to chat:', error);
            this.showConnectionError();
        }
    }

    async init() {
        // Get room ID from URL path
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        this.roomId = pathParts[pathParts.length - 1];

        // Initialize WebSocket connection
        await this.connectWebSocket();

        // Update room status after WebSocket is initialized
        this.updateRoomStatus();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const encodedToken = this.token ? encodeURIComponent(this.token) : '';
        const wsUrl = `${protocol}//${window.location.host}/ws/chatroom/${this.roomId}?${this.token ? `token=${encodedToken}` : ''}`;
        
        console.log('[WebSocket] Connecting to:', wsUrl);
        console.log('[WebSocket] Using token:', this.token ? 'Yes' : 'No');
        console.log('[WebSocket] Room ID:', this.roomId);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[WebSocket] Connection established');
            this.isConnected = true;
            this.connectionQuality = 'good';
            this.reconnectAttempts = 0; // Reset reconnection attempts
            clearTimeout(this.reconnectTimeout); // Clear any pending reconnection
            this.updateRoomStatus();
        };

        this.ws.onclose = () => {
            console.log('[WebSocket] Connection closed');
            this.isConnected = false;
            this.connectionQuality = 'disconnected';
            this.updateRoomStatus();
            this.attemptReconnect();
        };

        this.ws.onerror = () => {
            console.log('[WebSocket] Connection error');
            this.isConnected = false;
            this.connectionQuality = 'poor';
            this.updateRoomStatus();
        };

        this.ws.binaryType = 'arraybuffer';

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'auth') {
                    this.userId = message.user_id;
                    sessionStorage.setItem('current_user_id', this.userId);
                    return;
                }
                
                this.verifyOrigin(event);
                const data = this.decodeMessage(event.data);
                if (data.type === 'pong') {
                    this.lastPong = Date.now();
                } else {
                    this.handleMessage(data);
                }
            } catch (error) {
                console.error('Message processing error:', error);
                this.addSystemMessage('Error processing message');
            }
        };
    }

    verifyOrigin(event) {
        if (!this.allowedOrigins.has(event.origin)) {
            throw new Error('Unauthorized origin');
        }
    }

    handleMessage(data) {
        if (data.type === 'ack') {
            // Message acknowledged, remove from pending
            this.pendingMessages.delete(data.messageId);
        } else {
            switch (data.type) {
                case 'join_success':
                    this.username = data.username;
                    $('#roomId').text(`Room: ${this.roomId}`);
                    
                    // Show share dialog if requested
                    if (this.showShareDialogOnConnect) {
                        this.showShareDialogOnConnect = false;
                        setTimeout(() => this.showShareDialog(), 500); // Small delay for smoother UX
                    }
                    break;

                case 'chat':
                    this.addChatMessage(data.username, data.message);
                    break;

                case 'system':
                    this.addSystemMessage(data.message);
                    break;

                case 'room_closed':
                    alert('Room has been closed');
                    // window.location.href = '/';
                    break;

                case 'participant_update':
                    this.participantCount = data.count;
                    this.updateRoomStatus();
                    break;
            }
        }
    }

    async compressMessage(message) {
        if (message.length > 1024) { // Only compress large messages
            const stream = new Blob([message]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
            const compressedBlob = await new Response(compressedStream).blob();
            return compressedBlob;
        }
        return message;
    }

    validateMessage(message) {
        if (typeof message !== 'string' && !(message instanceof Blob)) {
            throw new Error('Invalid message type');
        }

        if (typeof message === 'string') {
            // Text message validation
            if (message.length > this.MAX_TEXT_LENGTH) {
                throw new Error(`Text message too long (max ${this.MAX_TEXT_LENGTH} characters)`);
            }
        } else if (message instanceof Blob) {
            // Image message validation
            if (message.size > this.MAX_IMAGE_SIZE) {
                throw new Error(`Image too large (max ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
            }
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Check length before sending
        if (message.length > this.MAX_MESSAGE_LENGTH) {
            return;
        }

        // First message validation
        if (!this.hasSentFirstMessage) {
            try {
                // Validate access before sending first message
                const response = await fetch('/api/chat/validate_access', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        room_id: this.roomId,
                        token: this.token || null
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail?.message || 'Access validation failed');
                }

                this.hasSentFirstMessage = true;
            } catch (error) {
                this.addSystemMessage(`Error: ${error.message}`);
                return;
            }
        }

        try {
            this.validateMessage(message);
            await this.sendMessage(JSON.stringify({
                type: 'chat',
                message: message
            }));
        } catch (error) {
            this.addSystemMessage(`Error: ${error.message}`);
        }

        this.messageInput.value = '';
        this.charCounter.style.display = 'none';
        this.charCounter.classList.remove('warning', 'error');
        this.messageInput.classList.remove('near-limit', 'error');
    }

    addChatMessage(username, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${username === this.username ? 'own' : 'other'}`;
        messageDiv.innerHTML = `
            <span class="username">${username}</span>
            <span class="text">${this.escapeHtml(message)}</span>
        `;
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = message;
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showShareDialog() {
        this.shareDialog.hidden = false;
        
        // Pre-generate share URL
        const shareUrl = `${window.location.origin}/join?room=${this.roomId}`;
        $('#shareUrl').val(shareUrl);
        
        // Optional: Auto-select the URL for easy copying
        $('#shareUrl').select();
    }

    leaveRoom() {
        if (confirm('Are you sure you want to leave this chat?')) {
            this.ws.close();
            // window.location.href = '/';
        }
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupMenu() {
        // Toggle menu on button click
        this.menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menuDropdown.hidden = !this.menuDropdown.hidden;
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            this.menuDropdown.hidden = true;
        });

        // Menu item handlers
        $('#muteBtn').addEventListener('click', () => {
            // Toggle mute logic here
            this.menuDropdown.hidden = true;
        });

        $('#deleteRoomBtn').addEventListener('click', () => {
            if (confirm('Are you sure to delete this room? This cannot be undone.')) {
                this.ws.send(JSON.stringify({ type: 'delete_room' }));
                // window.location.href = '/';
            }
            this.menuDropdown.hidden = true;
        });
    }

    setupMessageInput() {
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });

        this.messageInput.addEventListener('input', () => {
            const currentLength = this.messageInput.value.length;
            const remainingChars = this.MAX_MESSAGE_LENGTH - currentLength;
            
            // Only show counter when approaching limit (last 100 chars) or exceeding
            if (remainingChars <= 100) {
                this.charCounter.textContent = `${remainingChars}`;
                this.charCounter.style.display = 'block';
                
                if (remainingChars < 0) {
                    this.charCounter.classList.add('error');
                    this.messageInput.classList.add('error');
                    this.charCounter.classList.remove('warning');
                    this.messageInput.classList.remove('near-limit');
                } else {
                    this.charCounter.classList.add('warning');
                    this.messageInput.classList.add('near-limit');
                    this.charCounter.classList.remove('error');
                    this.messageInput.classList.remove('error');
                }
            } else {
                // Hide counter when well below limit
                this.charCounter.style.display = 'none';
                this.charCounter.classList.remove('warning', 'error');
                this.messageInput.classList.remove('near-limit', 'error');
            }

            // Auto-resize textarea
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
        });

        // Prevent file picker dialog
        this.messageInput.addEventListener('drop', (e) => {
            e.preventDefault();
        });

        this.messageInput.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    setupPlusMenu() {
        this.plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.plusMenu.classList.toggle('visible');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.plusMenu.contains(e.target) && 
                !this.plusBtn.contains(e.target) && 
                this.plusMenu.classList.contains('visible')) {
                this.plusMenu.classList.remove('visible');
            }
        });
    }

    generateMessageId() {
        // Using crypto.randomUUID() which is supported in modern browsers
        return crypto.randomUUID();
    }

    async sendMessage(message) {
        try {
            // Check rate limit
            const now = Date.now();
            this.messageTimestamps = this.messageTimestamps.filter(
                ts => now - ts < this.RATE_LIMIT_WINDOW
            );

            if (this.messageTimestamps.length >= this.RATE_LIMIT) {
                this.addSystemMessage('Message rate limit exceeded. Please wait a moment.');
                return;
            }

            // Record new timestamp
            this.messageTimestamps.push(now);

            // Generate unique message ID
            const messageId = this.generateMessageId();
            const messageWithId = {
                ...message,
                messageId,
                timestamp: Date.now()
            };

            // Encode and send message
            const encoded = this.encodeMessage(messageWithId);
            
            if (this.isConnected) {
                this.ws.send(encoded);
                this.pendingMessages.set(messageId, encoded);
            } else {
                this.messageQueue.push(encoded);
            }

            // Set timeout for message acknowledgment
            setTimeout(() => {
                if (this.pendingMessages.has(messageId)) {
                    // Message not acknowledged, retry
                    this.retryMessage(messageId);
                }
            }, 5000); // 5 second timeout

        } catch (error) {
            this.addSystemMessage(`Error: ${error.message}`);
            console.error('Message sending error:', error);
        }
    }

    retryMessage(messageId) {
        const message = this.pendingMessages.get(messageId);
        if (message) {
            this.sendMessage(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }

    updateRoomStatus() {
        // Format room ID - show first 3 and last 3 characters
        const roomIdLength = this.roomId.length;
        const formattedRoomId = roomIdLength > 6 ? 
            `${this.roomId.substring(0, 3)}...${this.roomId.substring(roomIdLength - 3)}` : 
            this.roomId;

        // Update roomInfo with room ID and participant count
        $('#roomInfo').textContent = `${formattedRoomId}, ${this.participantCount || 0} people`;

        // Determine the new status
        let newStatus;
        if (!this.isConnected) {
            newStatus = this.connectionQuality === 'connecting' ? 'connecting' : 'disconnected';
        } else {
            newStatus = 'connected';
        }

        // Only update if the status has changed
        if (newStatus !== this.currentStatus) {
            this.currentStatus = newStatus; // Update the current status
            this.statusIcon.className = 'status-icon'; // Reset classes
            $('#roomStatus').innerHTML = ''; // Clear content

            if (newStatus === 'connecting') {
                this.statusIcon.classList.add('connecting');
                $('#roomStatus').appendChild(this.statusIcon);
                $('#roomStatus').append(document.createTextNode(' Connecting...'));
            } else if (newStatus === 'disconnected') {
                this.statusIcon.classList.add('disconnected');
                $('#roomStatus').appendChild(this.statusIcon);
                $('#roomStatus').append(document.createTextNode(' Disconnected'));
            } else {
                // Connected: Clear roomStatus content
                $('#roomStatus').textContent = '';
            }
        }
    }

    encodeMessage(message) {
        try {
            const encoder = new TextEncoder();
            return encoder.encode(JSON.stringify(message));
        } catch (error) {
            console.error('Message encoding error:', error);
            throw new Error('Failed to encode message');
        }
    }

    decodeMessage(data) {
        try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(data));
            
            // Basic message validation
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message format');
            }
            
            return message;
        } catch (error) {
            console.error('Message decoding error:', error);
            throw new Error('Failed to decode message');
        }
    }

    attemptReconnect() {
        // Calculate delay: increase by 1 second each time, capped at 6 seconds
        const delay = Math.min(this.RECONNECT_BASE_DELAY + this.reconnectAttempts * 1000, this.MAX_RECONNECT_DELAY);
        console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connectWebSocket();
        }, delay);
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const chatRoom = new ChatRoom();
    await chatRoom.init();
});
