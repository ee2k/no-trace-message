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
        this.PING_INTERVAL = 30000; // 30 seconds
        this.isReconnecting = false; // Add this flag
        this.connectionStates = {
            CONNECTING: 0,
            CONNECTED: 1,
            DISCONNECTED: 2,
            ROOM_NOT_FOUND: 3
        };
        this.connectionState = this.connectionStates.DISCONNECTED;
        
        // Add these to existing constructor
        this.MAX_RETRIES = 3;
        this.failedMessages = new Map(); // Store failed messages

        this.setupMenu();
        this.setupMessageInput();
        this.setupPlusMenu();

        // Add send button handler
        $('#sendBtn').addEventListener('click', () => {
            const content = this.messageInput.value.trim();
            if (content) {
                this.sendTextMessage(content);
                this.messageInput.value = '';
                this.messageInput.style.height = 'auto';
            }
        });

        // Create and insert character counter
        this.charCounter = document.createElement('div');
        this.charCounter.className = 'char-counter';
        this.charCounter.style.display = 'none';
        $('.chat-input').append(this.charCounter);

        this.statusIcon = $('#roomStatus .status-icon');
        this.statusText = $('#roomStatus .status-text');
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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTextMessage(this.messageInput.value);
                this.messageInput.value = '';
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

        // Add image upload handler
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        this.plusMenu.querySelector('.plus-menu-item').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.sendImageMessage(e.target.files[0]);
            }
            fileInput.value = ''; // Reset input
        });
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
        
        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[WebSocket] Connection established');
                this.connectionState = this.connectionStates.CONNECTED;
                this.isConnected = true; // Add this line
                this.connectionQuality = 'good';
                this.reconnectAttempts = 0;
                clearTimeout(this.reconnectTimeout);
                this.updateRoomStatus();
                this.processMessageQueue();
                
                // Start ping interval
                this.pingInterval = setInterval(() => {
                    if (this.ws.readyState === WebSocket.OPEN) {
                        this.sendPing();
                    }
                }, this.PING_INTERVAL);
            };

            this.ws.onclose = (event) => {
                console.log('[WebSocket] Connection closed:', event);
                this.connectionState = this.connectionStates.DISCONNECTED;
                this.isConnected = false; // Add this line
                clearInterval(this.pingInterval);
                
                // Handle specific close codes
                switch (event.code) {
                    case 4004: // ROOM_NOT_FOUND
                        this.handleRoomNotFound();
                        break;
                    case 4003: // INVALID_TOKEN
                        this.handleInvalidToken();
                        break;
                    case 1000: // NORMAL_CLOSURE
                        this.addSystemMessage('Connection closed normally');
                        break;
                    default:
                        if (!event.wasClean) {
                            this.attemptReconnect();
                        }
                }
                
                this.updateRoomStatus();
            };

            this.ws.onerror = (error) => {
                console.log('[WebSocket] Connection error:', error);
                this.isConnected = false;
                this.connectionQuality = 'poor';
                this.updateRoomStatus();
                this.attemptReconnect();
            };

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
        } catch (error) {
            console.error('WebSocket connection error:', error);
            if (error.message.includes('404')) {
                this.updateRoomStatus();
            } else {
                this.attemptReconnect();
            }
        }
    }

    verifyOrigin(event) {
        // For WebSocket messages, always allow ws:// and wss:// from same host
        if (event.origin && event.origin.startsWith('ws')) {
            const wsHost = new URL(event.origin).host;
            const pageHost = window.location.host;
            return wsHost === pageHost;
        }
        
        // For other events, verify origin
        if (event.origin && !this.allowedOrigins.has(event.origin)) {
            console.warn('Message from unauthorized origin:', event.origin);
            return false;
        }
        return true;
    }

    handleMessage(data) {
        switch (data.message_type) {
            case 'chat':
                this.addChatMessage(data.sender, data.content, data.content_type);
                break;
            
            case 'system':
                this.addSystemMessage(data.content);
                break;
            
            case 'pong':
                // Update last pong time for connection health
                this.lastPong = Date.now();
                break;
            
            case 'ack':
                // Message acknowledged, remove from pending
                this.pendingMessages.delete(data.message_id);
                break;
            
            case 'participant_update':
                this.participantCount = data.count;
                this.updateRoomStatus();
                break;
            
            default:
                console.warn('Unknown message type:', data.message_type);
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

            // Generate unique message ID if not present
            if (!message.message_id) {
                message.message_id = this.generateMessageId();
            }

            // Add timestamp if not present
            if (!message.timestamp) {
                message.timestamp = Date.now();
            }

            // Validate message content
            this.validateMessage(message.content);

            // Encode and send message
            const encoded = this.encodeMessage(message);
            
            if (this.isConnected) {
                await this.ws.send(encoded);  // encoded is now a JSON string
                this.pendingMessages.set(message.message_id, message);
                
                // Set timeout for message acknowledgment
                setTimeout(() => {
                    if (this.pendingMessages.has(message.message_id)) {
                        this.retryMessage(message.message_id);
                    }
                }, 5000);
            } else {
                this.messageQueue.push(message);
                this.addSystemMessage('Message queued - waiting for connection');
            }

        } catch (error) {
            this.addSystemMessage(`Error: ${error.message}`);
            console.error('Message sending error:', error);
            throw error;
        }
    }

    sendPing() {
        const pingMessage = {
            message_type: 'ping',
            content_type: 'text',
            content: '',
            timestamp: Date.now()
        };
        this.ws.send(JSON.stringify(pingMessage));
    }

    generateMessageId() {
        // Using crypto.randomUUID() which is supported in modern browsers
        return crypto.randomUUID();
    }

    addChatMessage(username, message, contentType, status = 'sent') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${username === this.username ? 'own' : 'other'}`;
        
        if (contentType === 'text') {
            messageDiv.innerHTML = `
                <span class="username">${username}</span>
                <span class="text">${this.escapeHtml(message)}</span>
                ${status === 'failed' ? `
                    <button class="resend-btn" data-message-id="${message.message_id}"><svg class="icon-resend"><use href="/static/images/icons.svg#resend"></use></svg></button>
                ` : ''}
            `;
        } else if (contentType === 'image') {
            messageDiv.innerHTML = `
                <span class="username">${username}</span>
                <div class="image-container">
                    <img src="${message}" alt="User image" class="chat-image">
                </div>
            `;
        }
        
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();

        // Add click handler for resend button if present
        const resendBtn = messageDiv.querySelector('.resend-btn');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => {
                this.resendFailedMessage(message.message_id);
            });
        }
    }

    // Add new method for resending failed messages
    async resendFailedMessage(messageId) {
        const message = this.failedMessages.get(messageId);
        if (message) {
            // Remove from failed messages
            this.failedMessages.delete(messageId);
            // Reset retry count
            message.retryCount = 0;
            // Try sending again
            await this.sendMessage(message);
        }
    }

    // Modify retryMessage method
    retryMessage(messageId) {
        const message = this.pendingMessages.get(messageId);
        if (message) {
            message.retryCount = (message.retryCount || 0) + 1;
            
            if (message.retryCount >= this.MAX_RETRIES) {
                // Move to failed messages
                this.failedMessages.set(messageId, message);
                this.pendingMessages.delete(messageId);
                
                // Update message display to show failed status
                this.addChatMessage(message.sender, message.content, message.content_type, 'failed');
                this.addSystemMessage('Message failed to send. Click the retry button to try again.');
            } else {
                // Try sending again if under max retries
                this.sendMessage(message);
            }
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            // Messages in queue are already message objects, need to encode them
            const encoded = this.encodeMessage(message);
            this.ws.send(encoded);
            
            // Add to pending messages for acknowledgment tracking
            this.pendingMessages.set(message.message_id, message);
            
            // Set timeout for acknowledgment
            setTimeout(() => {
                if (this.pendingMessages.has(message.message_id)) {
                    this.retryMessage(message.message_id);
                }
            }, 5000);
        }
    }

    updateRoomStatus() {
        this.updateRoomDisplay();
    }

    updateRoomDisplay() {
        this.updateRoomInfo();
        this.updateConnectionStatus();
    }

    updateRoomInfo() {
        // Format room ID - show first 4 and last 4 characters
        const roomIdLength = this.roomId.length;
        const formattedRoomId = roomIdLength > 8 ? 
            `${this.roomId.substring(0, 4)}...${this.roomId.substring(roomIdLength - 4)}` : 
            this.roomId;

        // Update roomInfo with room ID and participant count
        $('#roomInfo').textContent = `${formattedRoomId} 👤 ${this.participantCount || 0}`;
    }

    updateConnectionStatus() {
        this.statusIcon.classList.remove('connecting', 'connected', 'disconnected', 'not-found');
        
        switch(this.connectionState) {
            case this.connectionStates.CONNECTED:
                this.statusIcon.classList.add('connected');
                this.statusText.textContent = 'Connected';
                break;
            
            case this.connectionStates.ROOM_NOT_FOUND:
                this.statusIcon.classList.add('not-found');
                this.statusText.textContent = 'Room not found';
                // Optionally redirect after a delay
                setTimeout(() => {
                    // window.location.href = '/join-private-chatroom';
                }, 3000);
                break;
            
            case this.connectionStates.CONNECTING:
                this.statusIcon.classList.add('connecting');
                this.statusText.textContent = 'Connecting...';
                break;
            
            default:
                this.statusIcon.classList.add('disconnected');
                this.statusText.textContent = 'Reconnecting...';
        }
    }

    encodeMessage(message) {
        try {
            return JSON.stringify(message);  // Simply stringify the message
        } catch (error) {
            console.error('Message encoding error:', error);
            throw new Error('Failed to encode message');
        }
    }

    decodeMessage(data) {
        try {
            // Handle if data is already a parsed object
            if (typeof data === 'object') {
                return data;
            }
            
            const decoder = new TextDecoder();
            let message;
            
            // Try parsing if data is string
            if (typeof data === 'string') {
                message = JSON.parse(data);
            } else {
                // Decode binary data
                message = JSON.parse(decoder.decode(data));
            }
            
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
        if (this.isReconnecting) return;
        this.isReconnecting = true;
        this.reconnectAttempts++; // Increment here
        const delay = Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY);
        console.log(`Next attempt in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
            this.isReconnecting = false;
        }, delay);
    }

    async sendTextMessage(content) {
        if (!content || !content.trim()) {
            return;
        }
        
        try {
            const message = {
                message_id: this.generateMessageId(),
                message_type: 'chat',
                content_type: 'text',
                content: content.trim(),
                sender: this.userId,
                timestamp: Date.now()
            };
            
            await this.sendMessage(message);
            
            // Only clear input and reset height if message was sent successfully
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addSystemMessage('Failed to send message. Please try again.');
        }
    }

    async sendImageMessage(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.addSystemMessage('Invalid image file');
            return;
        }

        if (file.size > this.MAX_IMAGE_SIZE) {
            this.addSystemMessage(`Image too large (max ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const message = {
                message_id: this.generateMessageId(),
                message_type: 'chat',
                content_type: 'image',
                content: e.target.result,
                sender: this.userId,
                timestamp: Date.now()
            };
            
            await this.sendMessage(message);
        };
        reader.readAsDataURL(file);
    }

    handleRoomNotFound() {
        this.connectionState = this.connectionStates.ROOM_NOT_FOUND;
        this.updateRoomStatus();
        this.addSystemMessage('Room not found. Please check the room ID and try again.');
        this.ws.close();
    }

    handleInvalidToken() {
        this.addSystemMessage('Invalid or missing access token');
        this.ws.close(); // Close the connection
    }

    handleServerError() {
        this.addSystemMessage('An unexpected error occurred');
        this.ws.close(); // Close the connection
    }

    handleGenericError() {
        this.addSystemMessage('An error occurred');
        this.ws.close(); // Close the connection
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const chatRoom = new ChatRoom();
    await chatRoom.init();
});
