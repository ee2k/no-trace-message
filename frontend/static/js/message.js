import { FONT_SIZES, BURN_TIMES } from './constants.js';
import { $ } from './utils/dom.js';
import { i18n } from './utils/i18n.js';
import { LanguageSelector } from './components/languageSelector.js';

class MessagePage {
    static async initialize() {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.updateTranslations();
        new LanguageSelector('languageSelector');
        return new MessagePage();
    }
    
    constructor() {
        // Get message ID and token from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.messageId = window.location.pathname.split('/').pop();
        this.token = null;
        
        // Elements
        this.progressBar = $('.progress-bar');
        this.textSkeleton = $('.text-skeleton');
        this.textContent = $('.text-content');
        this.imageSkeleton = $('.image-skeleton');
        this.imageContent = $('.image-content');
        this.messageImage = $('.message-image');
        this.lightbox = $('.lightbox');
        this.lightboxImage = $('img', this.lightbox);
        this.messageContent = $('.message-content');
        
        // Token related elements
        this.serverNotice = $('.server-notice');
        this.tokenForm = $('.token-form');
        this.tokenInput = $('#tokenInput');
        this.submitToken = $('#submitToken');
        this.errorMessage = $('.error-message');
        this.tokenCounter = $('.char-counter');
        
        // Constants
        this.MAX_TOKEN_LENGTH = 70;
        this.MIN_TOKEN_LENGTH = 6;
        
        // State
        this.burnTimeSeconds = 0;
        this.startTime = null;
        this.animationFrame = null;
        
        this.setupEventListeners();
        this.checkToken();
    }
    
    setupEventListeners() {
        // Image lightbox
        this.messageImage?.addEventListener('click', () => this.openLightbox());
        this.lightbox?.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.closeLightbox();
        });
        $('.close-lightbox')?.addEventListener('click', () => this.closeLightbox());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeLightbox();
        });
        
        // Token submission
        this.submitToken?.addEventListener('click', () => {
            const token = this.tokenInput.value.trim();
            if (token.length > this.MAX_TOKEN_LENGTH) {
                alert('Token is too long');
                return;
            }
            if (token) {
                sessionStorage.setItem(`msg_token_${this.messageId}`, token);
                this.loadMessage();
            }
        });

        // Token input with Ctrl/Cmd+Enter
        this.tokenInput?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const token = this.tokenInput.value.trim();
                if (token.length > this.MAX_TOKEN_LENGTH) {
                    alert('Token is too long');
                    return;
                }
                if (token) {
                    sessionStorage.setItem(`msg_token_${this.messageId}`, token);
                    this.loadMessage();
                }
            }
        });

        // Create and setup token counter
        if (this.tokenInput) {
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            this.tokenInput.parentNode.insertBefore(counter, this.tokenInput.nextSibling);
            this.tokenCounter = counter;

            // Show initial count
            this.tokenCounter.textContent = this.MAX_TOKEN_LENGTH.toString();

            // Update counter on input
            this.tokenInput.addEventListener('input', () => {
                const remaining = this.MAX_TOKEN_LENGTH - this.tokenInput.value.length;
                this.tokenCounter.textContent = remaining.toString();
            });
        }
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
                
                if (error.detail?.code) {
                    this.showError(error);
                    
                    // Handle specific status codes
                    switch (response.status) {
                        case 404:
                            window.location.href = '/not-found';
                            return;
                        case 400:
                            if (error.detail.code === 'INVALID_TOKEN') {
                                // Keep token form visible, hide other content
                                $('.actions').style.display = 'none';
                                $('.message-content').style.display = 'none';
                                $('.burn-progress').style.display = 'none';
                            }
                            break;
                    }
                } else {
                    this.showError({ detail: { code: 'SERVER_ERROR' } });
                }
                return;
            }
            
            // Show content and create button on successful token validation
            this.tokenForm.style.display = 'none';
            $('.message-content').style.display = 'block';
            $('.burn-progress').style.display = 'block';
            $('.actions').style.display = 'block';
            
            const data = await response.json();
            this.burnTimeSeconds = data.burn_index === 6 ? 
                Infinity : 
                BURN_TIMES[data.burn_index];
            
            await Promise.all([
                this.displayText(data.text, data.font_size),
                this.displayImage(data.images?.[0])
            ]);

            // Start burn countdown if not 'never'
            if (data.burn_index !== 6) {
                this.startBurnCountdown();
            }
        } catch (error) {
            console.error('Error loading message:', error);
            this.showError({ detail: { code: 'SERVER_ERROR' } });
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
        
        if (remaining > 0) {
            this.animationFrame = requestAnimationFrame(() => this.updateBurnProgress());
        } else {
            // Start dissolve effect
            this.startDissolveEffect();
        }
    }
    
    startDissolveEffect() {
        // Add dissolve classes
        this.textContent.classList.add('dissolving-text');
        this.messageContent.classList.add('dissolving-container');
        
        if (this.messageImage) {
            this.messageImage.classList.add('dissolving-text');
        }
        
        // Add dissolve effect to lightbox if it's open
        if (this.lightbox && this.lightbox.style.display === 'flex') {
            this.lightbox.classList.add('dissolving-lightbox');
            this.lightboxImage?.classList.add('dissolving-text');
        }
        
        // Wait for animation to complete before redirecting
        setTimeout(() => {
            // Clear content
            this.textContent.textContent = '';
            this.imageContent.style.display = 'none';
            this.messageImage.src = '';
            this.lightboxImage.src = '';
            this.lightbox.style.display = 'none';
            
            // Clear stored data
            sessionStorage.removeItem(`msg_token_${this.messageId}`);
            
            // Clear references
            this.token = null;
            this.messageId = null;
            
            // Navigate to not-found
            window.location.href = '/not-found';
        }, 500);
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
        const createNewBtn = $('.actions');
        const messageContent = $('.message-content');
        const burnProgress = $('.burn-progress');

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
                const hintSection = $('#tokenHintSection');
                const hintSpan = $('#messageTokenHint');
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

    showError(error) {
        let message;
        if (error.detail?.code) {
            if (error.detail.code === 'TOO_MANY_ATTEMPTS') {
                const minutes = Math.ceil(error.detail.wait_time / 60);
                message = i18n.t('message.errors.TOO_MANY_ATTEMPTS', { minutes });
            } else {
                message = i18n.t(`message.errors.${error.detail.code}`);
            }
        } else {
            message = i18n.t('message.errors.SERVER_ERROR');
        }
        
        const errorMessage = $('.error-message');
        
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
MessagePage.initialize();