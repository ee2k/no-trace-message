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
        this.setupShareButtons();
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
                    
                    const normalContent = button.$('.btn-content');
                    const copiedContent = button.$('.btn-content-copied');
                    
                    // Show copied state
                    normalContent.style.display = 'none';
                    copiedContent.style.display = 'flex';
                    
                    // Revert after 2 seconds
                    setTimeout(() => {
                        normalContent.style.display = 'flex';
                        copiedContent.style.display = 'none';
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
        });
    }

    setupShareButtons() {
        if (!navigator.share) {
            return;
        }

        // Show all share buttons if Web Share API is supported
        $$('.share-btn').forEach(btn => {
            btn.style.display = 'flex';
            
            btn.addEventListener('click', async () => {
                const targetId = btn.previousElementSibling.dataset.clipboard;
                const text = $('#' + targetId).textContent;
                const title = i18n.t('common.header');
                
                try {
                    await navigator.share({
                        title: title,
                        text: `${title}\n${text}`,
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed:', err);
                    }
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
                
                // Handle specific status codes
                switch (response.status) {
                    case 404:
                        window.location.href = '/not-found';
                        return;
                    case 400:
                        if (data.detail?.code) {
                            alert(i18n.t(`message.errors.${data.detail.code}`));
                        }
                        break;
                    default:
                        alert(i18n.t('message.errors.SERVER_ERROR'));
                }
                return;
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
            alert(i18n.t('message.errors.SERVER_ERROR'));
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await SuccessPage.initialize();
});
