import { initSvgIcons } from './global.js';

class SuccessPage {
    constructor() {
        initSvgIcons();
        
        // Get message ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.messageId = urlParams.get('id');
        
        // Elements
        this.messageUrl = document.getElementById('messageUrl');
        this.messageToken = document.getElementById('messageToken');
        this.tokenSection = document.getElementById('tokenSection');
        this.burnTime = document.getElementById('burnTime');
        this.expiryTime = document.getElementById('expiryTime');
        
        this.setupCopyButtons();
        this.setupCloseButton();
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
    
    setupCloseButton() {
        this.closeButton.addEventListener('click', () => {
            window.close();
            // Fallback if window.close() is blocked
            if (!window.closed) {
                window.location.href = '/';
            }
        });
    }
    
    async loadMessageMeta() {
        try {
            const response = await fetch(`/api/message/${this.messageId}/meta`);
            if (!response.ok) throw new Error('Failed to load message metadata');
            
            const data = await response.json();
            
            // Update all dynamic content
            this.burnTime.textContent = `${data.burn_time} seconds`;
            this.expiryTime.textContent = this.formatExpiryTime(data.expires_at);
            
            // Update URL display
            const baseUrl = `${window.location.origin}/message/${this.messageId}`;
            if (data.is_custom_token) {
                this.messageUrl.textContent = baseUrl;
                this.messageToken.textContent = data.token;
                this.tokenSection.style.display = 'block';
            } else {
                this.messageUrl.textContent = `${baseUrl}?token=${data.token}`;
            }
        } catch (error) {
            console.error('Error loading message metadata:', error);
        }
    }

    formatExpiryTime(expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diff = expiry - now;
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `in ${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `in ${hours} hours`;
        return `in ${Math.floor(hours / 24)} days`;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SuccessPage();
});
