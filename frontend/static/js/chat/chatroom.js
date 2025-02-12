import { $ } from '../utils/dom.js';

class ChatRoom {
    constructor() {
        // Initialize chat features
        this.ws = null;
        this.roomId = null;
        this.username = null;
        this.room_token = null;
        this.participantCount = 0;
        this.messageInput = $('#messageInput');
        this.chatArea = $('.chat-area');
        this.messages = $('#messages');
        this.shareDialog = $('#shareDialog');
        this.menuBtn = $('#menuBtn');
        this.menuDropdown = $('#menuDropdown');
        this.plusBtn = $('#plusBtn');
        this.plusMenu = $('#plusMenu');
        this.chatFooter = $('.chat-footer');
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
        this.messageStatus = {
            failed: 'failed',
            sending: 'sending',
            sent: 'sent',          // Reached server
            partial: 'partial',     // Some recipients
            delivered: 'delivered' // All recipients
        };

        // Create status hierarchy once during initialization
        this.statusHierarchy = Object.keys(this.messageStatus).reduce((acc, status, index) => {
            acc[status] = index;
            return acc;
        }, {});

        // Add participant tracking
        this.participants = new Map();  // userId -> {username, joinedAt}

        this.setupMenu();
        this.setupMessageInput();
        this.setupPlusMenu();

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

        this.wasAtBottom = true;
        this.newMessageIndicator = null;

        let scrollTimeout = null;

        this.chatArea.addEventListener('scroll', () => {
            // Clear any existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Check position immediately
            this.checkScrollPosition();
            
            // Set a timeout to check again after scrolling stops
            scrollTimeout = setTimeout(() => {
                this.checkScrollPosition();
                scrollTimeout = null;
            }, 100);
        });

        this.isWindowFocused = true;
        
        window.addEventListener('focus', () => {
            this.isWindowFocused = true;
            // Scroll to bottom if new messages arrived while unfocused
            if (this.isAtBottom) {
                this.scrollToBottom();
            }
        });
        
        window.addEventListener('blur', () => {
            this.isWindowFocused = false;
        });

        this.handleViewportChange = this.handleViewportChange.bind(this);
        window.addEventListener('resize', this.handleViewportChange);
        window.addEventListener('orientationchange', this.handleViewportChange);
        this.handleViewportChange();

        // Add touch listener for mobile scrolling
        this.chatArea.addEventListener('touchstart', () => {
            this.isUserScrolling = true;
        });
        
        this.chatArea.addEventListener('touchend', () => {
            this.isUserScrolling = false;
            this.checkScrollPosition();
        });

        // Try to load saved chat session from sessionStorage.
        const session = sessionStorage.getItem('chat_session');
        if (session) {
            const { user_id, username, room_id, room_token } = JSON.parse(session);
            this.userId = user_id;
            this.username = username;
            this.roomId = room_id; // if applicable
            this.room_token = room_token;   // if applicable
        }

        this.lightbox = $('.lightbox');
        if (this.lightbox) {
            this.lightboxImage = this.lightbox.$('img');
            // Close the lightbox when clicking outside the image or on the close button.
            this.lightbox.addEventListener('click', (e) => {
                if (e.target === this.lightbox || e.target.classList.contains('close-lightbox')) {
                    this.closeLightbox();
                }
            });
        }

        // Add a delegated event listener so that when an image with the 'chat-image' class is clicked, the lightbox opens.
        this.messages.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.classList.contains('chat-image')) {
                this.openLightbox(e.target.src);
            }
        });
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

        // Clear Messages handler
        $('#clearMsgBtn').addEventListener('click', () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    message_type: 'clear_messages',
                    sender_id: this.userId,
                    timestamp: Date.now()
                }));
            }
            this.menuDropdown.hidden = true;
        });

        // Delete Room handler
        $('#deleteRoomBtn').addEventListener('click', () => {
            if (confirm('Are you sure to delete this room? This cannot be undone.')) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ message_type: 'delete_room' }));
                }
            }
            this.menuDropdown.hidden = true;
        });

        // Leave Room handler
        $('#leaveBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to leave the room?')) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    // Optionally send a leave notification to update the participant list
                    this.ws.send(JSON.stringify({ message_type: 'leave_room' }));
                    this.ws.close();
                }
                this.messages.innerHTML = '';  // Clear displayed chat messages
                sessionStorage.clear();
                window.location.href = '/';
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

        // Prevent scrollToBottom when focusing input
        this.messageInput.addEventListener('focus', (e) => {
            this.isInputFocused = true;
        });

        this.messageInput.addEventListener('blur', (e) => {
            this.isInputFocused = false;
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

        // Retrieve chat session data from sessionStorage
        const sessionData = sessionStorage.getItem('chat_session');
        if (!sessionData) {
            alert("Session not found. Please join a room.");
            window.location.href = '/join-private-chatroom';
            return;
        }
        const chatSession = JSON.parse(sessionData);
        this.userId = chatSession.user_id;
        this.username = chatSession.username;

        // Optional: Check if the room in the session matches the URL.
        if (chatSession.room_id !== this.roomId) {
            console.warn(`Room ID mismatch: session room (${chatSession.room_id}) vs URL room (${this.roomId}).`);
            // Optionally, you may want to update the session or redirect.
        }

        try {
            // Fetch room metadata
            const response = await fetch(`/api/chat/private_room/${this.roomId}/meta`);
            if (!response.ok) {
                if (response.status === 404 && response.detail.code == 'ROOM_NOT_FOUND') {
                    this.handleRoomNotFound();
                    return;
                }
                // Handle other errors (including 500)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const roomData = await response.json();
            this.requiresToken = roomData.token_required;
            
            // If the room requires a token, get it from the session
            if (this.requiresToken) {
                this.room_token = chatSession.room_token;
                if (!this.room_token) {
                    alert("Token is required for this private room");
                    console.error("Token is required for private rooms");
                    window.location.href = '/join-private-chatroom';
                    return;
                }
            }
            
            // Initialize WebSocket connection
            await this.connectWebSocket();

            // Update room status after WebSocket is initialized
            this.updateRoomStatus();

            // Handle mobile viewport
            this.handleViewportChange();
            window.addEventListener('resize', () => this.handleViewportChange());
            window.addEventListener('orientationchange', () => this.handleViewportChange());
            
            // Ensure initial scroll position
            setTimeout(() => this.scrollToBottom(), 100);

            console.log('Retrieving token for room:', this.roomId);
            console.log('SessionStorage on chatroom load:', JSON.stringify(sessionStorage));

            // Add to init()
            // setInterval(() => {
            //     if (this.ws.readyState === WebSocket.OPEN) {
            //         this.ws.send(JSON.stringify({ message_type: 'get_participants' }));
            //     }
            // }, 10000);  // Every 10 seconds
        } catch (error) {
            console.error('Error initializing chat room:', error);
            this.handleRoomNotFound(); // Handle all errors as room not found
            this.updateRoomStatus();
        }
    }

    buildWebSocketUrl() {
        const chatSession = JSON.parse(sessionStorage.getItem('chat_session'));
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const params = new URLSearchParams({
            // username: encodeURIComponent(this.username),
            username: this.username,
            room_token: this.room_token || '',
            user_id: chatSession.user_id || ''
        });
        
        // Handle development ports
        const isLocalhost = window.location.hostname === 'localhost';
        const port = window.location.port ? `:${window.location.port}` : '';
        const host = isLocalhost ? 
            `${window.location.hostname}${port}` : 
            window.location.host;

        return `${protocol}//${host}/ws/chatroom/${this.roomId}?${params}`;
    }

    async connectWebSocket() {
        this.ws = new WebSocket(this.buildWebSocketUrl());
        
        console.log('[WebSocket] Connecting to:', this.ws.url);
        console.log('[WebSocket] Using token:', this.room_token ? 'Yes' : 'No');
        console.log('[WebSocket] Room ID:', this.roomId);
        
        try {
            this.ws.onopen = () => {
                console.log('[WebSocket] Connection established');
                
                // Send token immediately after connection using message_type
                if (this.requiresToken && this.room_token) {
                    const authMessage = {
                        message_type: 'auth',
                        room_token: this.room_token,
                        room_id: this.roomId
                    };
                    this.ws.send(JSON.stringify(authMessage));
                    console.log('Auth message sent:', authMessage);
                }
                
                // Request participant list using message_type
                this.ws.send(JSON.stringify({
                    message_type: 'get_participants'
                }));
                
                this.connectionState = this.connectionStates.CONNECTED;
                this.isConnected = true;
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

            this.ws.onmessage = (event) => {
                try {
                    const rawMessage = JSON.parse(event.data);
                    
                    // Handle special cases before verification/decoding
                    switch(rawMessage.message_type) {
                        case 'auth':
                            console.log('Auth received, setting user ID:', rawMessage.user_id);
                            this.userId = rawMessage.user_id;
                            sessionStorage.setItem('current_user_id', this.userId);
                            return;  // Exit early after handling
                            
                        case 'auth_ack':
                            console.log('Authentication successful');
                            return;  // Exit early after handling
                    }

                    // Common processing for other messages
                    this.verifyOrigin(event);
                    const data = this.decodeMessage(event.data);
                    
                    switch(data.message_type) {
                        case 'pong':
                            this.lastPong = Date.now();
                            break;
                        case 'room_deleted':
                            // Notify user, clear local data, and redirect to home
                            this.addSystemMessage("This room has been deleted by " + data.username + ". Redirecting...");
                            sessionStorage.clear();
                            setTimeout(() => {
                                this.messages.innerHTML = '';
                                window.location.href = "/";
                            }, 3000);
                            break;
                        default:
                            this.handleMessage(data);
                    }
                    
                    console.log('Processed message:', data);
                } catch (error) {
                    console.error('Message processing error:', error);
                    this.addSystemMessage('Error processing message');
                }
            };

            this.ws.onclose = (event) => {
                console.log('[WebSocket] Connection closed:', event);
                this.connectionState = this.connectionStates.DISCONNECTED;
                this.isConnected = false;
                clearInterval(this.pingInterval);
                
                // Handle closure even if connection state was "CONNECTED"
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
                    case 1005: // NO_STATUS_CODE (server restart)
                        // Treat this as a potential room expiration and check existence
                        this.attemptReconnect();
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

            console.log('WebSocket auth message:', {
                message_type: 'auth',
                room_token: this.room_token,
                room_id: this.roomId
            });
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
                    // Add message immediately, image will load asynchronously
                    this.addChatMessage(data.sender_id, {
                        ...data,
                        content: data.content // Pass the image URL directly
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
                if (data.code === 'FAILED_JOIN_ATTEMPT') {
                    const username = data.username;
                    const message = `Join attempt by ${username} was unsuccessful`;
                    this.addSystemMessage(message);
                    return;
                }
                this.addSystemMessage(data.content);
                break;
            
            case 'pong':
                this.lastPong = Date.now();
                break;
            
            case 'participant_list':
                this.handleParticipantList(data);
                break;
            
            case 'participant_joined':
                this.participants.set(data.user_id, data.username);
                this.addSystemMessage(`${data.username} 🎉`);
                this.updateRoomInfo();
                break;
            
            case 'participant_left':
                this.participants.delete(data.user_id);
                this.addSystemMessage(`${data.username} ✈️`);
                this.updateRoomInfo();
                break;
            
            case 'connection_info':
                this.userId = data.user_id;
                this.username = data.username || this.username;
                sessionStorage.setItem('chat_session', JSON.stringify({
                    user_id: data.user_id,
                    username: this.username,
                    room_id: this.roomId,
                    room_token: this.room_token
                }));
                this.updateRoomInfo();
                break;
            
            case 'clear_messages':
                this.messages.innerHTML = '';
                this.addSystemMessage(data.username + " " + "cleared messages");
                break;
            
            default:
                console.warn('Unknown message type:', data, data.message_type);
        }

        // Handle pending scroll after message is processed
        this.handlePendingScroll();
    }

    async sendMessage(message) {
        try {
            // Validate message ID before sending
            if (!message.message_id || typeof message.message_id !== 'string') {
                console.error('Message missing valid ID:', message);
                throw new Error('Message ID is required and must be a string');
            }
            
            // Add validation for required fields
            if (!message.content || !message.sender_id) {
                console.error('Invalid message structure:', message);
                throw new Error('Message missing required fields');
            }
            
            // For images, create object URL before sending
            if (message.content_type === 'image') {
                const blob = new Blob([message.content], {type: 'application/octet-stream'});
                message.raw_data = URL.createObjectURL(blob);
            }
            
            // Add message to UI immediately with 'sending' status
            const messageId = await this.addChatMessage(
                message.sender_id, 
                message.content, 
                message.content_type, 
                this.messageStatus.sending
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
        const timestamp = Date.now();
        try {
            // Generate 8-character unique string using different methods
            let shortUUID;
            if (crypto.randomUUID) {
                // Take first 8 chars from standard UUID
                shortUUID = crypto.randomUUID().split('-')[0];
            } else {
                // Fallback: 4 random bytes as hex (8 characters)
                const buffer = new Uint8Array(4);
                crypto.getRandomValues(buffer);
                shortUUID = Array.from(buffer, byte => 
                    byte.toString(16).padStart(2, '0')
                ).join('');
            }
            return `${timestamp}-${shortUUID}`;
        } catch (error) {
            // Ultimate fallback: timestamp + random string
            console.error('UUID generation failed:', error);
            const randStr = Math.random().toString(36).substr(2, 8);
            return `${timestamp}-${randStr}`;
        }
    }

    async addChatMessage(sender_id, message, contentType, status = this.messageStatus.sending) {
        const isOwnMessage = sender_id === this.userId;
        const messageId = (typeof message === 'object' ? message.message_id : null) || this.generateMessageId();
        const timestamp = new Date(typeof message === 'object' ? message.timestamp : Date.now());
        
        // Get sender's username
        const senderName = this.participants.get(sender_id);
        const displayName = senderName || `User ${sender_id.slice(0, 4)}`;
        
        // Check if the last message was from the same user
        const lastMessage = this.messages.lastElementChild;
        const isSameUser = lastMessage && 
            lastMessage.dataset.senderId === sender_id &&
            !lastMessage.classList.contains('system');
        
        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isOwnMessage ? 'own' : 'other'}`;
        messageContainer.dataset.timestamp = timestamp.getTime();
        messageContainer.dataset.messageId = messageId;
        messageContainer.dataset.senderId = sender_id;
        
        // Handle content based on type
        const messageContent = typeof message === 'object' ? message.content : message;
        let contentHtml = '';
        
        if (contentType === 'image') {
            if (isOwnMessage) {
                // Use local Blob URL from raw_data directly
                contentHtml = `
                    <div class="image-container">
                        <img src="${message.raw_data}" class="chat-image">
                    </div>
                `;
            } else {
                // Remote image - show skeleton and trigger load
                contentHtml = `
                    <div class="image-container loading">
                        <div class="image-skeleton"></div>
                    </div>
                `;
                
                // Schedule image load after DOM insertion
                requestAnimationFrame(() => {
                    this.loadImageForMessage({
                        ...message,
                        message_id: messageId,
                        content: message.content
                    });
                });
            }
        } else {
            // First escape HTML, then convert newlines
            const escapedContent = this.escapeHtml(messageContent || '');
            const formattedContent = escapedContent
                .replace(/\n/g, '<br>') // Convert newlines to <br> tags
                .replace(/ /g, '&nbsp;'); // Preserve multiple spaces
            contentHtml = `<span class="text">${formattedContent}</span>`;
        }
        
        // Status icons for own messages
        const statusHtml = isOwnMessage ? `
            <div class="message-status" data-status="${status}"></div>
        ` : '';
        
        // Only show username if it's a new user
        const usernameHtml = !isSameUser ? `
            <span class="username">${this.escapeHtml(displayName)}</span>
        ` : '';
        
        messageContainer.innerHTML = `
            ${isOwnMessage ?
                `<button class="message-retry ${status === 'failed' ? 'visible' : 'hidden'}">⇡</button>`
                : ''}
            ${usernameHtml}
            <div class="message-content ${isOwnMessage ? 'own' : 'other'}">
                ${contentHtml}
                ${statusHtml}
            </div>
        `;
        
        // Check scroll position BEFORE adding message
        this.checkScrollPosition();
        const wasAtBottomBeforeAdd = this.isAtBottom;

        console.log('Before adding message:', {
            wasAtBottomBeforeAdd,
            scrollHeight: this.chatArea.scrollHeight,
            clientHeight: this.chatArea.clientHeight,
            scrollTop: this.chatArea.scrollTop
        });

        // Add message to DOM
        this.messages.appendChild(messageContainer);
        this.updateMessageTimes();

        // Use requestAnimationFrame to allow DOM updates, then:
        requestAnimationFrame(() => {
            // Recheck the scroll position after the new message element has been added.
            this.checkScrollPosition();  // This will update this.isAtBottom

            if (isOwnMessage) {
                // Always scroll to bottom when sending a message.
                this.scrollToBottom();
            } else {
                // For incoming messages:
                // • If the chat was already at the bottom before, scroll automatically.
                // • Otherwise, do not scroll (newMessageIndicator logic will kick in).
                if (this.isAtBottom) {
                    // If the chat was already at the bottom, auto-scroll.
                    this.scrollToBottom();
                } else {
                    if (!this.newMessageIndicator) {
                        this.createNewMessageIndicator();
                    }
                }
            }
            // Otherwise, do not auto-scroll; let checkScrollPosition's logic handle showing
            // the new-message indicator (which now appears only when new messages are dropped 
            // into the chat while not at the bottom).
        });
        
        // Add click handler for retry button
        const retryButton = messageContainer.$('.message-retry');
        if (retryButton) {
            retryButton.onclick = () => this.resendFailedMessage(messageId);
        }
        
        return messageId;
    }

    // Restore original loadImageForMessage implementation
    async loadImageForMessage(message) {
        // Skip local images completely
        if (message.sender_id === this.userId || message.content.startsWith('local:')) {
            return;
        }
        
        const imageId = message.content;
        if (!imageId) return;

        try {
            // Restore proper query parameters from working version
            const imageUrl = `/api/chat/get-image/${imageId}?room_id=${encodeURIComponent(this.roomId)}&user_id=${encodeURIComponent(this.userId)}`;
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            const img = new Image();
            img.src = objectUrl;
            img.onload = () => {
                const messageContainer = this.messages.$(`[data-message-id="${message.message_id}"]`);
                if (messageContainer) {
                    const imageContainer = messageContainer.$('.image-container');
                    if (imageContainer) {
                        imageContainer.classList.remove('loading');
                        imageContainer.innerHTML = `
                            <img src="${objectUrl}" class="chat-image">
                        `;
                        
                        if (this.isAtBottom) {
                            this.scrollToBottom();
                        }
                    }
                }
            };
        } catch (error) {
            console.error('[Image Load] Error loading image:', error);
            const messageContainer = this.messages.$(`[data-message-id="${message.message_id}"]`);
            if (messageContainer) {
                const imageContainer = messageContainer.$('.image-container');
                if (imageContainer) {
                    imageContainer.classList.remove('loading');
                    imageContainer.innerHTML = `
                        <div class="image-error">⦰</div>
                    `;
                }
            }
            // Restore status update from working version
            this.updateMessageStatus(message.message_id, this.messageStatus.failed);
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

        this.participantCount = this.participants.size
        // Update roomInfo with room ID and participant count
        $('#roomInfo').textContent = `${formattedRoomId} 👤﹡ ${this.participantCount}`;
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

    async checkRoomExists() {
        const metaUrl = `/api/chat/private_room/${this.roomId}/meta`;
        try {
            const response = await fetch(metaUrl);
            // If the meta call succeeds, assume the room exists.
            if (response.ok) {
                return true;
            } else if (response.status === 404 && responseData.detail?.code === 'ROOM_NOT_FOUND') {
                // Room not found
                return false;
            } else {
                // For other statuses, you may choose to treat them as temporary
                // or assume the room still exists. Here we log and assume exists.
                console.warn("Unexpected response status while checking room existence:", response.status);
                return true;
            }
        } catch (error) {
            // For network errors, log the error and return true so that transient issues don't cancel reconnection.
            console.error("Error checking room existence:", error);
            return true;
        }
    }

    async attemptReconnect() {
        try {
            const exists = await this.checkRoomExists();
            if (!exists) {
                this.handleRoomNotFound();
                return;
            }
            if (this.isReconnecting) return;
            this.isReconnecting = true;
            this.reconnectAttempts++; // Increment here
            const delay = Math.min(this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY);
            console.log(`Next attempt in ${delay}ms (attempt ${this.reconnectAttempts})`);
            this.reconnectTimeout = setTimeout(() => {
                this.connectWebSocket();
                this.isReconnecting = false;
            }, delay);
        } catch (error) {
            console.error("Error during reconnection attempt:", error);
        }
    }

    async sendTextMessage(content) {
        if (!content?.trim()) return;
        
        try {
            const message = {
                message_id: this.generateMessageId(),
                message_type: 'chat',
                content_type: 'text',
                content: content.trim(),
                sender_id: this.userId,
                timestamp: Date.now()
            };

            console.log('Sending message:', message);  // Add debug log
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
            const messageId = this.generateMessageId();
            
            // 1. Create local Blob URL immediately
            const blobUrl = URL.createObjectURL(file);
            
            // 2. Create message with LOCAL reference only
            const message = {
                message_id: messageId,
                message_type: 'chat',
                content_type: 'image',
                content: 'local:' + blobUrl, // Local identifier
                sender_id: this.userId,
                timestamp: Date.now(),
                raw_data: blobUrl // Store Blob URL directly
            };

            // 3. Add to UI immediately using Blob URL
            this.addChatMessage(this.userId, message, 'image', this.messageStatus.sending);

            // 4. Upload in background (doesn't block UI)
            const formData = new FormData();
            formData.append('image', file);
            formData.append('message_id', messageId);
            formData.append('room_id', this.roomId);
            formData.append('sender_id', this.userId);
            formData.append('timestamp', Date.now());

            const response = await fetch('/api/chat/upload-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                // 5. Update message with server ID but keep local reference
                message.content = result.image_id; // Server ID
                message.raw_data = blobUrl; // Maintain local reference
                this.updateMessageStatus(messageId, 'sent');
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Image send failed:', error);
            this.updateMessageStatus(messageId, 'failed');
        }
    }

    handleRoomNotFound() {
        this.connectionState = this.connectionStates.ROOM_NOT_FOUND;
        this.updateRoomStatus();
        this.addSystemMessage('Room not found.');
        this.addSystemMessage('Redirecting...');
        
        // Clean up any existing connection
        if (this.ws) {
            this.ws.close();
        }
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    handleInvalidToken() {
        this.addSystemMessage('Invalid or missing access token');
        this.ws.close(); // Close the connection
        
        // Redirect to join-private-chatroom after 2 seconds
        setTimeout(() => {
            window.location.href = '/join-private-chatroom';
        }, 2000);
    }

    handleServerError() {
        this.addSystemMessage('An unexpected error occurred');
        this.ws.close(); // Close the connection
    }

    handleGenericError() {
        this.addSystemMessage('An error occurred');
        this.ws.close(); // Close the connection
    }

    updateMessageStatus(messageId, newStatus) {
        // Get current message status
        const messageElement = this.messages.$(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const currentStatus = messageElement.$('.message-status')?.dataset.status;
        if (!currentStatus) return;

        // Check if new status is lower than current status
        if (this.statusHierarchy[newStatus] < this.statusHierarchy[currentStatus]) {
            return; // Don't update if new status is lower
        }

        // Update status in UI
        const statusElement = messageElement.$('.message-status');
        if (statusElement) {
            statusElement.dataset.status = newStatus;
            statusElement.innerHTML = this.getStatusIcon(newStatus);
        }

        // Update status in pending messages map
        if (this.pendingMessages.has(messageId)) {
            const message = this.pendingMessages.get(messageId);
            message.status = newStatus;
        }
    }

    getStatusIcon(status) {
        const icons = {
            failed: '',
            sending: '<span class="message-status-icon sending">•••</span>',
            sent: '<span class="message-status-icon sent">✓</span>',
            partial: '<span class="message-status-icon partial">✓+</span>',
            delivered: '<span class="message-status-icon delivered"><span class="check">✓</span><span class="check">✓</span></span>'
        };
        return icons[status] || '';
    }

    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = message;
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        this.scrollingInProgress = true; // flag used to prevent indicator creation during scroll

        this.scrollTimeout = setTimeout(() => {
            if (!this.chatArea) return;
            
            // Calculate the target scroll position.
            const target = this.chatArea.scrollHeight - this.chatArea.clientHeight;

            // If scroll is needed, adjust it.
            if (Math.abs(this.chatArea.scrollTop - target) > 10) {
                this.chatArea.scrollTop = target;
            }
            this.isAtBottom = true;
            // Remove the new message indicator if present.
            if (this.newMessageIndicator) {
                this.newMessageIndicator.remove();
                this.newMessageIndicator = null;
            }
            this.scrollingInProgress = false;

            console.log('[Scroll] scrollToBottom executed', {
                scrollTop: this.chatArea.scrollTop,
                target,
                diff: Math.abs(this.chatArea.scrollTop - target)
            });

            // After a short delay, recheck the scroll position (to catch any layout changes)
            setTimeout(() => {
                this.checkScrollPosition();
            }, 100);
        }, 50);
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

    checkScrollPosition() {
        if (!this.chatArea) return;
        // Skip if a scroll-to-bottom is in progress.
        if (this.scrollingInProgress) {
            if (this.delayedIndicatorTimeout) {
                clearTimeout(this.delayedIndicatorTimeout);
                this.delayedIndicatorTimeout = null;
            }
            return;
        }

        const buffer = 15; // small margin of error
        const { scrollTop, clientHeight, scrollHeight } = this.chatArea;
        this.isAtBottom = scrollTop + clientHeight >= scrollHeight - buffer;
        // console.log("=== checkScrollPosition - isAtBottom ", this.isAtBottom);

        // If at bottom, clear any pending new-message-indicator
        if (this.isAtBottom) {
            if (this.delayedIndicatorTimeout) {
                clearTimeout(this.delayedIndicatorTimeout);
                this.delayedIndicatorTimeout = null;
            }
            if (this.newMessageIndicator) {
                this.newMessageIndicator.remove();
                this.newMessageIndicator = null;
            }
        }

        console.log('[Scroll] checkScrollPosition', {
            scrollTop,
            clientHeight,
            scrollHeight,
            isAtBottom: this.isAtBottom,
            buffer,
        });
    }

    createNewMessageIndicator() {
        if (this.newMessageIndicator) return;

        this.newMessageIndicator = document.createElement('button');
        this.newMessageIndicator.className = 'new-message-indicator';
        this.newMessageIndicator.textContent = '⬇';
        this.newMessageIndicator.addEventListener('click', () => {
            this.scrollToBottom();
            if (this.newMessageIndicator) {
                this.newMessageIndicator.remove();
                this.newMessageIndicator = null;
            }
        });

        // Append indicator to the container that holds the messages.
        // (Ensure that your chat area container element is not the footer.)
        if (this.chatAreaContainer) {
            this.chatAreaContainer.appendChild(this.newMessageIndicator);
        } else if (this.chatArea) {
            this.chatArea.appendChild(this.newMessageIndicator);
        } else {
            document.body.appendChild(this.newMessageIndicator);
        }
    }

    handlePendingScroll() {
        if (this.isAtBottom && !this.isWindowFocused) {
            this.scrollToBottom();
        }
    }
    handleViewportChange() {
        // Mobile browsers need this hack to handle keyboard properly
        setTimeout(() => {
            if (this.isAtBottom) {
                this.scrollToBottom(true);
            }
        }, 300);
    }

    handleParticipantList(message) {
        this.participants.clear();
        message.participants.forEach(p => {
            this.participants.set(p.user_id, p.username);
        });
        this.updateRoomDisplay();
        this.updateMessageTimes();  // Force UI refresh
    }

    openLightbox(src) {
        if (this.lightbox && this.lightboxImage) {
            this.lightboxImage.src = src;
            this.lightbox.style.display = 'flex';
        }
    }

    closeLightbox() {
        if (this.lightbox && this.lightboxImage) {
            this.lightboxImage.src = '';
            this.lightbox.style.display = 'none';
        }
    }
}
// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const chatRoom = new ChatRoom();
    await chatRoom.init();
});

function setVhVariable() {
    // Use visualViewport if available (most modern mobile browsers support it)
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
}
// Update on resize and orientation change
window.addEventListener('resize', setVhVariable);
window.addEventListener('orientationchange', setVhVariable);
setVhVariable();
