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
        this.messageStatuses = {
            FAILED: 'failed',
            SENDING: 'sending',
            SENT: 'sent',        // Delivered to server
            DELIVERED: 'delivered' // Delivered to recipients
        };

        // Add participant tracking
        this.participants = new Map();  // userId -> {username, joinedAt}

        this.setupMenu();
        this.setupMessageInput();
        this.setupPlusMenu();

        // Create and insert character counter
        this.charCounter = document.createElement('div');
        this.charCounter.className = 'char-counter';
        this.charCounter.style.display = 'none';
        $('.chat-input').append(this.charCounter);

        this.statusIcon = $('#roomStatus .status-icon');
        this.statusText = $('#roomStatus .status-text');

        // Add to existing constructor
        this.escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        this.username = sessionStorage.getItem('username');
        this.userId = sessionStorage.getItem('current_user_id');
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
        // Add send button handler
        $('#sendBtn').addEventListener('click', () => {
            const content = this.messageInput.value.trim();
            if (content) {
                this.sendTextMessage(content);
                this.messageInput.value = '';
                this.messageInput.style.height = 'auto';
            }
        });
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

        this.plusMenu.$('.plus-menu-item').addEventListener('click', () => {
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
        const encodedUsername = encodeURIComponent(this.username);
        const wsUrl = `${protocol}//${window.location.host}/ws/chatroom/${this.roomId}?username=${encodedUsername}${this.token ? `&token=${encodedToken}` : ''}`;
        
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
                    console.log('Received message:', event.data);
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'auth') {
                        console.log('Auth received, setting user ID:', message.user_id);
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
                    console.log('Processing message:', message);
                } catch (error) {
                    console.error('Message processing error:', error);
                    console.log('Raw message:', event.data);
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

    async handleMessage(data) {
        switch (data.message_type) {
            case 'chat':
                if (data.content_type === 'image') {
                    // Add message with image
                    this.addChatMessage(data.sender_id, {
                        ...data,
                        content: await this.fetchImage(data.content)
                    }, 'image');
                } else {
                    this.addChatMessage(data.sender_id, data, data.content_type);
                }
                break;
            
            case 'ack':
                if (data.message_id) {
                    this.updateMessageStatus(data.message_id, data.status);
                    this.pendingMessages.delete(data.message_id);
                }
                break;
            
            case 'system':
                this.addSystemMessage(data.content);
                break;
            
            case 'pong':
                this.lastPong = Date.now();
                break;
            
            case 'participant_list':
                // Initialize participant list
                data.participants.forEach(participant => {
                    this.participants.set(participant.user_id, {
                        username: participant.username,
                        joinedAt: Date.now()
                    });
                });
                this.updateParticipantDisplay();
                break;
            
            case 'user_joined':
                // Add new participant
                this.participants.set(data.user.user_id, {
                    username: data.user.username,
                    joinedAt: Date.now()
                });
                this.addSystemMessage(`${data.user.username} ✋`);
                this.updateParticipantDisplay();
                break;
            
            case 'user_left':
                // Remove participant
                const leftUser = this.participants.get(data.user_id);
                if (leftUser) {
                    this.participants.delete(data.user_id);
                    this.addSystemMessage(`⬅ ${leftUser.username}`);
                    this.updateParticipantDisplay();
                }
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
            // Add message to UI immediately with 'sending' status
            const messageId = this.addChatMessage(
                message.sender_id, 
                message.content, 
                message.content_type, 
                this.messageStatuses.SENDING
            );
            message.message_id = messageId;

            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    if (this.isConnected) {
                        // Restructure message to match backend expectations
                        const messageData = {
                            message_id: message.message_id,
                            message_type: message.message_type || 'chat',
                            content_type: message.content_type || 'text',
                            content: message.content,
                            sender_id: this.userId,
                            timestamp: Date.now()
                        };
                        
                        console.log('Sending formatted message:', messageData);
                        await this.ws.send(this.encodeMessage(messageData));
                        // Message sent successfully
                        this.updateMessageStatus(messageId, 'sent');
                        return;
                    } else {
                        this.messageQueue.push(message);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    attempts++;
                    if (attempts === maxAttempts) {
                        this.updateMessageStatus(messageId, 'failed');
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }
        } catch (error) {
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

    addChatMessage(sender_id, message, contentType, status = this.messageStatuses.SENDING) {
        const messageContainer = document.createElement('div');
        const isOwnMessage = sender_id === this.userId;
        messageContainer.className = `message-container ${isOwnMessage ? 'own' : 'other'}`;
        const messageId = (typeof message === 'object' ? message.message_id : null) || this.generateMessageId();
        
        const timestamp = new Date(typeof message === 'object' ? message.timestamp : Date.now());
        
        // Add timestamp to container
        messageContainer.dataset.timestamp = timestamp.getTime();
        
        // Status icons for own messages
        const statusHtml = isOwnMessage ? `
            <div class="message-status" data-status="${status}">
                <svg class="message-status-icon">
                    <use href="/static/images/loading.svg#icon"></use>
                </svg>
            </div>
        ` : '';
    
        // Get sender's username
        const sender = this.participants.get(sender_id);
        const displayName = sender ? sender.username : `User ${sender_id.slice(0, 4)}`;
        
        // Handle content based on type
        const messageContent = typeof message === 'object' ? message.content : message;
        const contentHtml = contentType === 'image' ? `
            <div class="image-container">
                <img src="${messageContent}" class="chat-image">
            </div>
        ` : `<span class="text">${this.escapeHtml(messageContent || '')}</span>`;
    
        messageContainer.innerHTML = `
            ${isOwnMessage ? `
                <button class="message-retry ${status === 'failed' ? 'visible' : 'hidden'}">
                    <svg class="icon-resend"><use href="/static/images/resend.svg#icon"></use></svg>
                </button>
            ` : ''}
            <span class="username">${this.escapeHtml(displayName)}</span>
            <div class="message-content ${isOwnMessage ? 'own' : 'other'}">
                ${contentHtml}
                ${statusHtml}
            </div>
        `;
        
        messageContainer.dataset.messageId = messageId;
        this.messages.appendChild(messageContainer);
        this.updateMessageTimes();
        this.scrollToBottom();
        
        // Add click handler for retry button
        const retryButton = messageContainer.$('.message-retry');
        if (retryButton) {
            retryButton.onclick = () => this.resendFailedMessage(messageId);
        }
        
        return messageId;
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
                this.addChatMessage(message.sender_id, message.content, message.content_type, 'failed');
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
                this.statusIcon.classList.add('connecting');
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
                sender_id: this.userId,
                timestamp: Date.now()
            };
            
            console.log('Sending message:', message);
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

        try {
            // Generate message ID and timestamp
            const messageId = this.generateMessageId();
            const timestamp = Date.now();

            // Create message with local image and loading icon
            const reader = new FileReader();
            const imageUrl = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            const message = {
                message_id: messageId,
                message_type: 'chat',
                content_type: 'image',
                content: imageUrl,
                sender_id: this.userId,
                timestamp: timestamp
            };

            // Add message to UI with loading state
            this.addChatMessage(this.userId, message, 'image', this.messageStatuses.SENDING);

            // setTimeout(() => {alert("before sending image");}, 0);
            // Upload image with message metadata
            const formData = new FormData();
            formData.append('image', file);
            formData.append('message_id', messageId);
            formData.append('timestamp', timestamp.toString());
            formData.append('room_id', this.roomId)
            formData.append('sender_id', this.userId)

            const response = await fetch('/api/chat/upload-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.reason || 'Image upload failed');
            }

            // Update message status to sent
            this.updateMessageStatus(messageId, 'sent');
        } catch (error) {
            console.error('Failed to send image:', error);
            this.updateMessageStatus(messageId, 'failed');
            this.addSystemMessage('Failed to send image. Please try again.');
        }
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

    updateMessageStatus(messageId, status) {
        alert("updateMessageStatus: "+status)
        const messageContainer = $(`[data-message-id="${messageId}"]`);
        if (!messageContainer) return;
      
        const statusDiv = messageContainer.$('.message-status');
        if (!statusDiv) return;
      
        // Update the data-status attribute
        statusDiv.dataset.status = status;
      
        // Update the SVG href based on the status
        const svgUse = statusDiv.$('use');
        if (svgUse) {
            switch (status) {
                case 'sending':
                    svgUse.setAttribute('href', '/static/images/loading.svg#icon');
                    break;
                case 'sent':
                    svgUse.setAttribute('href', '/static/images/check.svg#icon');
                    break;
                case 'delivered':
                    svgUse.setAttribute('href', '/static/images/d_check.svg#icon');
                    break;
                case 'failed':
                    svgUse.setAttribute('href', '');
                    break;
                default:
                    console.warn('Unknown status:', status);
          }
        }
    }

    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = message;
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    updateParticipantDisplay() {
        // Update UI to show current participants
        const participantCount = this.participants.size;
        this.participantCount = participantCount;
        this.updateRoomStatus();
    }

    async fetchImage(imageId) {
        try {
            const response = await fetch(`/api/chat/get-image/${imageId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    }

    updateMessageContent(messageId, newContent) {
        const messageContainer = this.messages.$(`[data-message-id="${messageId}"]`);
        if (messageContainer) {
            const contentDiv = messageContainer.$('.message-content');
            if (contentDiv) {
                contentDiv.innerHTML = newContent;
            }
        }
    }

    // Add this method to handle time display
    updateMessageTimes() {
        const messages = Array.from(this.messages.$$('.message-container'));
        let lastTime = null;
        
        // Remove existing time messages
        this.messages.$$('.message-time').forEach(el => el.remove());
        
        messages.forEach((message, index) => {
            const timestamp = Number(message.dataset.timestamp);
            const messageTime = new Date(timestamp);
            
            // Show time if it's the first message or 5 minutes after last time
            if (!lastTime || messageTime - lastTime > 5 * 60 * 1000) {
                const timeDiv = document.createElement('div');
                timeDiv.className = 'message system message-time';
                timeDiv.textContent = messageTime.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                });
                this.messages.insertBefore(timeDiv, message);
                lastTime = messageTime;
            }
        });
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const chatRoom = new ChatRoom();
    await chatRoom.init();
});
