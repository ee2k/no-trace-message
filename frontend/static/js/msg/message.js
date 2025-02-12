import { checkBrowser } from '../utils/browser_check.js';
import { FONT_SIZES, BURN_TIMES } from '../constants.js';
import { $ } from '../utils/dom.js';
import { i18n } from '../utils/i18n.js';

class MessagePage {
    static async initialize() {
        if (!(await checkBrowser())) return;
        await i18n.loadTranslations(i18n.currentLocale, null, 'common');
        i18n.updateTranslations();
        return new MessagePage();
    }
    
    constructor() {
        // Initialize properties
        this.messageId = window.location.pathname.split('/').pop();
        this.initializeElements();
        
        this.loadMessage();

        this.setupEventListeners();
    }

    showTokenForm() {
        this.tokenForm.style.display = 'block';
        // Clear any existing token
        sessionStorage.removeItem(`msg_token_${this.messageId}`);
        this.tokenInput.value = '';
    }

    showTokenHint(hint) {
        const hintSection = $('#tokenHintSection');
        const hintSpan = $('#messageTokenHint');
        hintSpan.textContent = ` ${hint}`;
        hintSection.style.display = 'block';
    }

    async submitToken() {
        const token = this.tokenInput.value.trim();
        if (!token || token.length > this.MAX_TOKEN_LENGTH) {
            return;
        }

        try {
            const response = await fetch(`/api/message/${this.messageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const error = await response.json();
                this.showError(error);
                return;
            }

            const data = await response.json();
            this.tokenForm.style.display = 'none';
            this.displayContent(data);
        } catch (error) {
            this.showError({ detail: { code: 'SERVER_ERROR' } });
        }
    }

    initializeElements() {
        // Elements
        this.progressBar = $('.progress-bar');
        this.textSkeleton = $('.text-skeleton');
        this.textContent = $('.text-content');
        this.imageSkeleton = $('.image-skeleton');
        this.imageContent = $('.image-content');
        this.messageImage = $('.message-image');
        this.lightbox = $('.lightbox');
        this.lightboxImage = this.lightbox.$('img');
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
                    
                    if (response.status === 404) {
                        window.location.href = '/not-found';
                        return;
                    }
                    
                    if (response.status === 400 && error.detail.code === 'INVALID_TOKEN') {
                        // Keep token form visible, hide other content
                        $('.actions').style.display = 'none';
                        $('.message-content').style.display = 'none';
                        $('.burn-progress').style.display = 'none';
                    }
                } else {
                    this.showError({ detail: { code: 'SERVER_ERROR' } });
                }
                return;
            }
            
            const data = await response.json();

            if (data.needs_token) {
                // Show token form and hint if available
                this.showTokenForm();
                if (data.token_hint) {
                    this.showTokenHint(data.token_hint);
                }
                return;
            }

            // No token needed or valid token provided - display content
            this.displayContent(data);
            
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
        $('.burn-progress').style.display = 'block';
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
    
    showError(error) {
        let message;
        if (error.detail?.code) {
            if (error.detail.code === 'TOO_MANY_ATTEMPTS') {
                // const minutes = Math.ceil(error.detail.wait_time / 60);
                message = i18n.t('message.errors.TOO_MANY_ATTEMPTS');
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

    displayContent(data) {
        this.tokenForm.style.display = 'none';
        $('.message-content').style.display = 'block';
        $('.actions').style.display = 'block';
        
        this.burnTimeSeconds = data.burn_index === 6 ? 
            Infinity : 
            BURN_TIMES[data.burn_index];
        
        Promise.all([
            this.displayText(data.text, data.font_size),
            this.displayImage(data.images?.[0])
        ]);

        if (data.burn_index !== 6) {
            this.startBurnCountdown();
        }
    }
}

MessagePage.initialize();