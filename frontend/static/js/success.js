import { initSvgIcons } from './global.js';
import { EXPIRY_TIMES, BURN_TIMES } from './constants.js';
import { $, $$ } from './utils/dom.js';

class SuccessPage {
    constructor() {
        initSvgIcons();
        
        // Get message ID from sessionStorage
        this.messageId = sessionStorage.getItem('current_message_id');
        sessionStorage.removeItem('current_message_id'); // Clean up after use
        
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
        
        this.expiryTimes = EXPIRY_TIMES;
        this.burnTimes = BURN_TIMES;
        
        this.setupCopyButtons();
        this.setupShareButton();
        this.loadMessageMeta();
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
                // Show error message first
                alert(data.detail?.message || 'Failed to load message metadata');
                // Then redirect after user acknowledges
                window.location.href = '/';
                return;
            }
            
            // Format burn time nicely
            const burnTimeText = data.burn_time === 'never' ? 
                'never' : 
                `${parseFloat(data.burn_time).toString().replace(/\.0$/, '')} second${parseFloat(data.burn_time) === 1 || parseFloat(data.burn_time) === 0.1 ? '' : 's'}`;
            this.burnTime.textContent = burnTimeText;
            
            // Use index to get label
            this.expiryTime.textContent = this.expiryTimes[data.expiry_index];
            
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
            alert(error.message);
            window.location.href = '/';
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
document.addEventListener('DOMContentLoaded', () => {
    new SuccessPage();
});
