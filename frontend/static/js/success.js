import { initSvgIcons } from './global.js';
import { $, $$ } from './utils/dom.js';
import { i18n } from './utils/i18n.js';

class SuccessPage {
    static async initialize() {
        try {
            await i18n.loadTranslations(i18n.currentLocale);
            i18n.updateTranslations();
        } catch (error) {
            console.warn('Failed to load translations:', error);
            // Continue anyway since we have English fallback in common.js
        }
        return new SuccessPage();
    }

    constructor() {
        initSvgIcons();
        
        // Get message ID from sessionStorage
        this.messageId = sessionStorage.getItem('current_message_id');
        if (!this.messageId) {
            window.location.href = '/';
            return;
        }
        
        // Get token from sessionStorage
        this.token = sessionStorage.getItem(`msg_token_${this.messageId}`);
        
        // Elements
        this.messageUrl = $('#messageUrl');
        this.messageToken = $('#messageToken');
        this.tokenSection = $('#tokenSection');
        this.burnTime = $('#burnTime');
        this.expiryTime = $('#expiryTime');
        this.messageTokenHint = $('#messageTokenHint');
        this.tokenHintSection = $('#tokenHintSection');
        
        this.setupCopyButtons();
        this.setupShareButton();
        this.loadMessageMeta().then(() => {
            // Only remove from sessionStorage after successful load
            sessionStorage.removeItem('current_message_id');
        });
    }
    
    setupCopyButtons() {
        $$('.copy-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const targetId = button.dataset.clipboard;
                const text = $('#' + targetId).textContent;
                
                try {
                    await navigator.clipboard.writeText(text);
                    
                    // Update button appearance
                    const originalContent = button.innerHTML;
                    button.innerHTML = `
                        <svg class="copy-icon">
                            <use href="static/images/checkmark.svg#icon"></use>
                        </svg>
                        <span>Copied!</span>
                    `;
                    button.classList.add('copied');
                    
                    // Revert after 2 seconds
                    setTimeout(() => {
                        button.innerHTML = originalContent;
                        button.classList.remove('copied');
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
        });
    }
    
    async loadMessageMeta() {
        try {
            const token = sessionStorage.getItem(`msg_token_${this.messageId}`);
            
            const response = await fetch(`/api/message/${this.messageId}/meta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token || '' })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Server error:', data);
                if (response.status === 404) {
                    alert(data.detail?.message || 'Message not found');
                    window.location.href = '/';
                    return;
                }
            }
            
            // Use i18n for both times
            const burnTranslation = i18n.t(`times.burn.${data.burn_index}`);
            if (burnTranslation) {
                this.burnTime.textContent = burnTranslation;
            }

            const expiryTranslation = i18n.t(`times.expiry.${data.expiry_index}`);
            if (expiryTranslation) {
                this.expiryTime.textContent = expiryTranslation;
            }
            
            // Update URL and token display
            const baseUrl = `${window.location.origin}/message/${this.messageId}`;
            this.messageUrl.textContent = baseUrl;
            
            if (token) {
                this.messageToken.textContent = token;
                this.tokenSection.style.display = 'block';
                
                if (data.token_hint) {
                    this.messageTokenHint.textContent = data.token_hint;
                    this.tokenHintSection.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error loading message metadata:', error);
            alert('Failed to load message details. Please try refreshing the page.');
        }
    }
    
    setupShareButton() {
        const shareBtn = $('.share-btn');
        
        if (!navigator.share) {
            return;
        }

        // Show button if share API is supported
        shareBtn.style.display = 'flex';

        // Share handler
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: 'Burn after reading',
                    text: '',
                    url: this.messageUrl.textContent
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await SuccessPage.initialize();
});
