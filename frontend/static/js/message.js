import { FONT_SIZES } from './constants.js';

class MessagePage {
    constructor() {
        // Get message ID and token from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.messageId = window.location.pathname.split('/').pop();
        this.token = null;
        
        // Elements
        this.progressBar = document.querySelector('.progress-bar');
        this.burnTimer = document.querySelector('.burn-timer');
        this.textSkeleton = document.querySelector('.text-skeleton');
        this.textContent = document.querySelector('.text-content');
        this.imageSkeleton = document.querySelector('.image-skeleton');
        this.imageContent = document.querySelector('.image-content');
        this.messageImage = document.querySelector('.message-image');
        this.lightbox = document.querySelector('.lightbox');
        this.lightboxImage = this.lightbox.querySelector('img');
        
        // State
        this.burnTimeSeconds = 0;
        this.startTime = null;
        this.animationFrame = null;
        
        this.serverNotice = document.querySelector('.server-notice');
        this.tokenForm = document.querySelector('.token-form');
        this.tokenInput = document.querySelector('#tokenInput');
        this.submitToken = document.querySelector('#submitToken');
        this.errorMessage = document.querySelector('.error-message');
        
        this.setupEventListeners();
        this.checkToken();
    }
    
    setupEventListeners() {
        // Image lightbox
        this.messageImage?.addEventListener('click', () => this.openLightbox());
        this.lightbox?.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.closeLightbox();
        });
        document.querySelector('.close-lightbox')?.addEventListener('click', () => this.closeLightbox());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeLightbox();
        });
        
        // Token submission
        this.submitToken?.addEventListener('click', () => {
            const token = this.tokenInput.value.trim();
            if (token.length > 70) {
                alert('Token is too long');
                return;
            }
            if (token) {
                sessionStorage.setItem(`msg_token_${this.messageId}`, token);
                this.loadMessage();
            }
        });

        // Remove the keypress event listener that was handling Enter
        // And add new keydown listener for Ctrl/Cmd+Enter
        this.tokenInput?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const token = this.tokenInput.value.trim();
                if (token.length > 70) {
                    alert('Token is too long');
                    return;
                }
                if (token) {
                    sessionStorage.setItem(`msg_token_${this.messageId}`, token);
                    this.loadMessage();
                }
            }
        });

        // Token input character counter
        this.tokenInput?.addEventListener('input', () => {
            const remaining = 70 - this.tokenInput.value.length;
            this.tokenCounter.textContent = remaining.toString();
            
            if (this.tokenInput.value.length > 0 && this.tokenInput.value.length < 6) {
                this.tokenCounter.classList.add('error');
                this.submitToken.disabled = true;
            } else {
                this.tokenCounter.classList.remove('error');
                this.submitToken.disabled = false;
            }
        });
    }
    
    async loadMessage() {
        try {
            const token = sessionStorage.getItem(`msg_token_${this.messageId}`);
            const response = await fetch(`/api/message/${this.messageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token || '' })
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 429) {
                    const minutes = Math.ceil(error.detail.wait_time / 60);
                    this.showError(`Too many failed attempts. Please wait ${minutes} minutes before trying again.`);
                } else if (response.status === 401 || response.status === 404) {
                    // Keep token form visible, hide other content on failed attempt
                    this.showError('Wrong token. Please try again.');
                    document.querySelector('.actions').style.display = 'none';
                    document.querySelector('.message-content').style.display = 'none';
                    document.querySelector('.burn-progress').style.display = 'none';
                } else {
                    this.showError('Network error. Please try again later.');
                }
                return;
            }
            
            // Show content and create button on successful token validation
            this.tokenForm.style.display = 'none';
            document.querySelector('.message-content').style.display = 'block';
            document.querySelector('.burn-progress').style.display = 'block';
            document.querySelector('.actions').style.display = 'block';
            
            const data = await response.json();
            this.burnTimeSeconds = data.burn_time === 'never' ? Infinity : parseFloat(data.burn_time);
            
            await Promise.all([
                this.displayText(data.text, data.font_size),
                this.displayImage(data.images?.[0])
            ]);

            // Start burn countdown if not 'never'
            if (data.burn_time !== 'never') {
                this.startBurnCountdown();
            }
        } catch (error) {
            console.error('Error loading message:', error);
            this.showError('Network error. Please try again later.');
        }
    }
    
    async displayText(text, fontSize) {
        if (!text) {
            this.textSkeleton.style.display = 'none';
            return;
        }
        
        this.textContent.textContent = text;
        if (fontSize !== null && fontSize !== undefined) {
            this.textContent.style.fontSize = FONT_SIZES[fontSize];
        }
        this.textSkeleton.style.display = 'none';
        this.textContent.style.display = 'block';
    }
    
    async displayImage(imageData) {
        if (!imageData) {
            this.imageSkeleton.style.display = 'none';
            return;
        }
        
        return new Promise((resolve) => {
            this.messageImage.onload = () => {
                this.imageSkeleton.style.display = 'none';
                this.imageContent.style.display = 'block';
                resolve();
            };
            // Create data URL from base64 content
            const dataUrl = `data:${imageData.type};base64,${imageData.content}`;
            this.messageImage.src = dataUrl;
            this.lightboxImage.src = dataUrl;
        });
    }
    
    startBurnCountdown() {
        this.startTime = Date.now();
        this.updateBurnProgress();
    }
    
    updateBurnProgress() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.burnTimeSeconds - elapsed);
        const progress = (remaining / this.burnTimeSeconds) * 100;
        
        this.progressBar.style.width = `${progress}%`;
        this.burnTimer.textContent = `${Math.ceil(remaining)}s`;
        
        if (remaining > 0) {
            this.animationFrame = requestAnimationFrame(() => this.updateBurnProgress());
        } else {
            this.burnMessage();
        }
    }
    
    burnMessage() {
        // Clear content
        this.textContent.textContent = '';
        this.messageImage.src = '';
        this.lightboxImage.src = '';
        
        // Navigate to not-found page
        window.location.href = '/not-found';
    }
    
    openLightbox() {
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    closeLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    async checkToken() {
        const token = sessionStorage.getItem(`msg_token_${this.messageId}`);
        const metadata = await this.loadMessageMeta();
        
        if (!metadata) {
            return;
        }

        // Control visibility of elements
        const createNewBtn = document.querySelector('.actions');
        const messageContent = document.querySelector('.message-content');
        const burnProgress = document.querySelector('.burn-progress');

        // Hide content and progress by default
        messageContent.style.display = 'none';
        burnProgress.style.display = 'none';
        createNewBtn.style.display = 'none';

        if (metadata.needs_token) {
            // Show token form, hide other content
            this.tokenForm.style.display = 'block';
            // Clear any existing token from sessionStorage on page load
            sessionStorage.removeItem(`msg_token_${this.messageId}`);
            // Clear token input value
            this.tokenInput.value = '';
        } else {
            // No token needed
            createNewBtn.style.display = 'block';
            this.loadMessage();
        }
    }

    async loadMessageMeta() {
        try {
            const response = await fetch(`/api/message/${this.messageId}/check`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    window.location.href = '/not-found';
                    return null;
                }
                throw new Error('Failed to check message');
            }
            
            const data = await response.json();
            
            // Show hint if available
            if (data.needs_token && data.token_hint) {
                const hintSection = document.getElementById('tokenHintSection');
                const hintSpan = document.getElementById('messageTokenHint');
                hintSpan.textContent = ` ${data.token_hint}`;
                hintSection.style.display = 'block';
            }

            return data;
        } catch (error) {
            console.error('Error checking message:', error);
            window.location.href = '/not-found';
            return null;
        }
    }

    showError(message) {
        const errorMessage = document.querySelector('.error-message');
        
        // If already showing an error, fade out first
        if (errorMessage.style.display === 'block') {
            errorMessage.style.opacity = '0';
            setTimeout(() => {
                errorMessage.textContent = message;
                errorMessage.style.opacity = '1';
            }, 300);
        } else {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.opacity = '1';
            }, 10);
        }
    }
}

// Initialize
new MessagePage(); 