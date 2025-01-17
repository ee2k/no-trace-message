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
        this.messageInput = $('#messageInput');
        this.messages = $('#messages');
        this.shareDialog = $('#shareDialog');
        this.menuBtn = $('#menuBtn');
        this.menuDropdown = $('#menuDropdown');
        this.plusBtn = $('#plusBtn');
        this.plusMenu = $('#plusMenu');
        this.MAX_MESSAGE_LENGTH = 2000;
        
        this.init();
        this.setupMenu();
        this.setupMessageInput();
        this.setupPlusMenu();

        // Create and insert character counter
        this.charCounter = document.createElement('div');
        this.charCounter.className = 'char-counter';
        this.charCounter.style.display = 'none';
        document.querySelector('.chat-input').appendChild(this.charCounter);

        // Check if we should show share dialog on load
        const params = new URLSearchParams(window.location.search);
        if (params.get('show_share') === 'true') {
            // Wait for WebSocket connection before showing dialog
            this.showShareDialogOnConnect = true;
        }
    }

    init() {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        this.roomId = params.get('room');
        this.token = params.get('token');

        // Temporarily disable redirect
        // if (!this.roomId) {
        //     window.location.href = '/';
        //     return;
        // }

        // Setup event listeners
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('shareBtn').addEventListener('click', () => this.showShareDialog());
        document.getElementById('leaveBtn').addEventListener('click', () => this.leaveRoom());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Setup WebSocket
        this.connectWebSocket();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

        this.ws.onopen = () => {
            // Join room
            this.ws.send(JSON.stringify({
                type: 'join',
                room: this.roomId,
                token: this.token
            }));
            const roomStatus = document.getElementById('roomStatus');
            roomStatus.textContent = 'Connected';
            roomStatus.classList.remove('connecting');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            // Update room status with animated dots
            const roomStatus = document.getElementById('roomStatus');
            roomStatus.textContent = 'Reconnecting';
            roomStatus.classList.add('connecting');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'join_success':
                this.username = data.username;
                document.getElementById('roomId').textContent = `Room: ${this.roomId}`;
                
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
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Check length before sending
        if (message.length > this.MAX_MESSAGE_LENGTH) {
            // Optionally show an error message to user
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'chat',
            message: message
        }));

        this.messageInput.value = '';
        // Reset counter and styles
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
        document.getElementById('shareUrl').value = shareUrl;
        
        // Optional: Auto-select the URL for easy copying
        document.getElementById('shareUrl').select();
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
        document.getElementById('muteBtn').addEventListener('click', () => {
            // Toggle mute logic here
            this.menuDropdown.hidden = true;
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('Clear all chat history?')) {
                this.messages.innerHTML = '';
                this.addSystemMessage('Chat history cleared');
            }
            this.menuDropdown.hidden = true;
        });

        document.getElementById('deleteRoomBtn').addEventListener('click', () => {
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
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatRoom();
});
