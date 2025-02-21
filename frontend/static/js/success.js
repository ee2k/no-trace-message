import { $, $$ } from './utils/dom.js';
import { i18n } from './utils/i18n.js';
import { prettyEncodeURL } from './utils/url.js'
import { setupCopyButtons, setupShareButtons, setupBurnMessageButtons } from './utils/copy-share.js';

class SuccessPage {
    static async initialize() {
        try {
            await i18n.loadTranslations(i18n.currentLocale, null, 'common');
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
        
        setupCopyButtons();
        setupShareButtons();
        setupBurnMessageButtons();
        this.loadMessageMeta().then(() => {
            // Only remove from sessionStorage after successful load
            sessionStorage.removeItem('current_message_id');
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
            const baseUrl = `${window.location.origin}/message/${prettyEncodeURL(this.messageId)}`;
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
