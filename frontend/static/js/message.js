class MessagePage {
    constructor() {
        // Get message ID and token from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.messageId = window.location.pathname.split('/').pop();
        this.token = urlParams.get('token');
        
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
        
        this.setupEventListeners();
        this.loadMessage();
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
    }
    
    async loadMessage() {
        try {
            const formData = new FormData();
            if (this.token) formData.append('token', this.token);
            
            const response = await fetch(`/api/message/${this.messageId}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                window.location.href = '/not-found';
                return;
            }
            
            const data = await response.json();
            this.burnTimeSeconds = data.burn_time;
            
            // Load content only when both text and images are ready
            await Promise.all([
                this.displayText(data.text),
                this.displayImage(data.images?.[0])
            ]);
            
            // Start burn countdown
            this.startBurnCountdown();
            
        } catch (error) {
            console.error('Failed to load message:', error);
            window.location.href = '/not-found';
        }
    }
    
    async displayText(text) {
        if (!text) {
            this.textSkeleton.style.display = 'none';
            return;
        }
        
        this.textContent.textContent = text;
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
            this.messageImage.src = imageData;
            this.lightboxImage.src = imageData;
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
}

// Initialize
new MessagePage(); 