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
        this.messagePreview = document.getElementById('messagePreview');
        this.imagePreview = document.getElementById('imagePreview');
        this.closeButton = document.querySelector('.button.secondary');
        
        this.setupCopyButtons();
        this.setupCloseButton();
        this.loadMessageData();
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
    
    async loadMessageData() {
        try {
            const response = await fetch(`/api/message/${this.messageId}/preview`);
            if (!response.ok) throw new Error('Failed to load message data');
            
            const data = await response.json();
            
            // Update URL display
            const baseUrl = `${window.location.origin}/message/${this.messageId}`;
            if (data.customToken) {
                this.messageUrl.textContent = baseUrl;
                this.messageToken.textContent = data.token;
                this.tokenSection.style.display = 'block';
            } else {
                this.messageUrl.textContent = `${baseUrl}?token=${data.token}`;
            }
            
            // Update preview
            this.messagePreview.textContent = data.text;
            
            // Update image preview if exists
            if (data.hasImage) {
                const img = document.createElement('img');
                img.src = `/api/message/${this.messageId}/image/preview`;
                img.alt = 'Message image';
                this.imagePreview.appendChild(img);
            }
            
        } catch (error) {
            console.error('Error loading message data:', error);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SuccessPage();
});
