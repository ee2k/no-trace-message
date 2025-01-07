import { initSvgIcons } from './global.js';
import { EXPIRY_TIMES, BURN_TIMES } from './constants.js';

class SuccessPage {
    constructor() {
        initSvgIcons();
        
        // Get message ID from sessionStorage
        this.messageId = sessionStorage.getItem('current_message_id');
        sessionStorage.removeItem('current_message_id'); // Clean up after use
        
        // Get token from sessionStorage
        this.token = sessionStorage.getItem(`msg_token_${this.messageId}`);
        
        // Elements
        this.messageUrl = document.getElementById('messageUrl');
        this.messageToken = document.getElementById('messageToken');
        this.tokenSection = document.getElementById('tokenSection');
        this.burnTime = document.getElementById('burnTime');
        this.expiryTime = document.getElementById('expiryTime');
        this.messageTokenHint = document.getElementById('messageTokenHint');
        this.tokenHintSection = document.getElementById('tokenHintSection');
        
        this.expiryTimes = EXPIRY_TIMES;
        this.burnTimes = BURN_TIMES;
        
        this.setupCopyButtons();
        this.loadMessageMeta();
    }
    
    setupCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const targetId = button.dataset.clipboard;
                const text = document.getElementById(targetId).textContent;
                
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
            
            if (!response.ok) throw new Error('Failed to load message metadata');
            
            const data = await response.json();
            
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
            console.error('Failed to load message metadata:', error);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SuccessPage();
});
