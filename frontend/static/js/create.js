// import { initSvgIcons } from './global.js';
import { FONT_SIZES } from './constants.js';
import { $ } from './utils/dom.js';
import { setupSlider, updateCharCounter } from './utils/ui.js';
import { i18n } from './utils/i18n.js';
import { LanguageSelector } from './components/languageSelector.js';

class MessageCreator {
    static async initialize() {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.updateTranslations();
        new LanguageSelector('languageSelector');
        return new MessageCreator();
    }

    constructor() {
        // initSvgIcons();
        
        this.messageInput = $('#messageContent');
        this.dropZone = $('#dropZone');
        this.fileInput = $('#fileInput');
        this.imagePreviews = $('#imagePreviews');
        this.createBtn = $('#createBtn');
        
        this.images = new Set();
        this.MAX_IMAGES = 1;
        this.MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
        this.ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.MAX_MESSAGE_LENGTH = 2000;
        
        this.customTokenBtn = $('#customTokenBtn');
        this.tokenInputContainer = $('#tokenInputContainer');
        this.customToken = $('#customToken');
        this.tokenCounter = $('#tokenCounter');
        this.tokenHint = $('#tokenHint');
        this.hintCounter = $('#hintCounter');
        
        this.MIN_TOKEN_LENGTH = 6;
        this.MAX_TOKEN_LENGTH = 70;
        
        // Characters chosen for readability (no I,l,0,O etc.)
        this.TOKEN_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        this.TOKEN_LENGTH = 8;
        
        this.setupEventListeners();
        this.setupCharCounter();
        this.setupExpirySlider();
        this.setupBurnTimeSlider();
        this.setupTokenInput();
        this.setupTokenGenerator();
        this.setupFontSizeControls();
        
        // Initialize rate limiting
        this.initRateLimiting();
    }
    
    setupEventListeners() {
        // Prevent browser from opening dropped files
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        // Drag and drop handlers
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // File input handler
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Create button handler
        this.createBtn.addEventListener('click', () => this.createMessage());
    }
    
    setupCharCounter() {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.display = 'none';
        this.messageInput.parentNode.insertBefore(counter, this.messageInput.nextSibling);
        
        this.messageInput.addEventListener('input', () => {
            updateCharCounter(this.messageInput, counter, this.MAX_MESSAGE_LENGTH, {
                warningThreshold: 100,
                onValid: () => {
                    this.messageInput.classList.remove('error', 'near-limit');
                    this.createBtn.disabled = false;
                },
                onInvalid: () => {
                    this.messageInput.classList.add('error');
                    this.messageInput.classList.remove('near-limit');
                    this.createBtn.disabled = true;
                }
            });
        });
    }
    
    setupExpirySlider() {
        const slider = $('#expiryTime');
        const valueDisplay = $('.slider-value', slider.parentElement);
        setupSlider(slider, valueDisplay, i18n.getExpiryTimes());
    }
    
    setupBurnTimeSlider() {
        const slider = $('#burnTime');
        const valueDisplay = $('.slider-value', slider.parentElement);
        setupSlider(slider, valueDisplay, i18n.getBurnTimes());
    }
    
    setupTokenInput() {
        this.customTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = !this.tokenInputContainer.classList.contains('show');
            
            // Toggle button state
            this.customTokenBtn.classList.toggle('active');
            
            // Show container before animation
            if (isHidden) {
                this.tokenInputContainer.style.display = 'block';
                // Small delay to ensure display: block is applied
                setTimeout(() => {
                    this.tokenInputContainer.classList.add('show');
                }, 10);
            } else {
                this.tokenInputContainer.classList.remove('show');
                // Hide after animation completes
                setTimeout(() => {
                    this.tokenInputContainer.style.display = 'none';
                }, 300); // Match transition duration
                
                this.customToken.value = '';
                this.tokenHint.value = '';
                this.customToken.dispatchEvent(new Event('input'));
                this.tokenHint.dispatchEvent(new Event('input'));
            }
        });

        // Token counter
        this.customToken.addEventListener('input', () => {
            const remaining = this.MAX_TOKEN_LENGTH - this.customToken.value.length;
            this.tokenCounter.textContent = remaining.toString();
            
            if (this.customToken.value.length > 0 && this.customToken.value.length < this.MIN_TOKEN_LENGTH) {
                this.tokenCounter.classList.add('error');
                this.createBtn.disabled = true;
            } else {
                this.tokenCounter.classList.remove('error');
                this.createBtn.disabled = false;
            }
        });

        // Hint counter
        this.tokenHint.addEventListener('input', () => {
            const remaining = this.MAX_TOKEN_LENGTH - this.tokenHint.value.length;
            this.hintCounter.textContent = remaining.toString();
        });
    }
    
    setupTokenGenerator() {
        const generateBtn = $('.generate-token');
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const token = this.generateReadableToken();
            this.customToken.value = token;
            // Trigger input event to update character counter
            this.customToken.dispatchEvent(new Event('input'));
        });
    }

    generateReadableToken() {
        let token = '';
        for (let i = 0; i < this.TOKEN_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * this.TOKEN_CHARS.length);
            token += this.TOKEN_CHARS[randomIndex];
        }
        return token;
    }
    
    handleFiles(files) {
        if (this.images.size >= this.MAX_IMAGES) {
            alert(i18n.t('create.validation.maxImages', { count: this.MAX_IMAGES }));
            this.fileInput.value = '';  // Reset file input after alert
            return;
        }
        
        Array.from(files).slice(0, this.MAX_IMAGES - this.images.size).forEach(file => {
            if (!this.ALLOWED_TYPES.includes(file.type)) {
                alert(i18n.t('create.validation.fileType').replace('{{type}}', file.type));
                this.fileInput.value = '';  // Reset file input after type error
                return;
            }
            
            if (file.size > this.MAX_IMAGE_SIZE) {
                alert(i18n.t('create.validation.fileSize').replace('{{size}}', this.MAX_IMAGE_SIZE / 1024 / 1024));
                this.fileInput.value = '';  // Reset file input after size error
                return;
            }
            
            this.addImagePreview(file);
        });
    }
    
    addImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="remove-btn">
                    <svg class="icon-primary" width="16" height="16">
                        <use href="static/images/close.svg#icon"></use>
                    </svg>
                </button>
            `;
            
            $('.remove-btn', preview).addEventListener('click', () => {
                this.images.delete(file);
                preview.remove();
                this.fileInput.value = '';  // Reset file input
            });
            
            this.imagePreviews.appendChild(preview);
            this.images.add(file);
        };
        reader.readAsDataURL(file);
    }
    
    initRateLimiting() {
        const now = Date.now();
        const minute = 60 * 1000;
        
        // Get or initialize browser requests from sessionStorage
        let browserRequests = JSON.parse(sessionStorage.getItem('create_requests') || '[]');
        
        // Clean old requests
        browserRequests = browserRequests
            .filter(time => (now - time) < minute)
            .map(Number);  // Ensure numbers
            
        sessionStorage.setItem('create_requests', JSON.stringify(browserRequests));
    }
    
    async createMessage() {
        const message = this.messageInput.value.trim();
        if (!message && this.images.size === 0) {
            alert(i18n.t('create.validation.emptyMessage'));
            return;
        }
        
        const formData = new FormData();
        formData.append('message', message);
        
        formData.append('expiry_index', $('#expiryTime').value);
        formData.append('burn_index', $('#burnTime').value);
        formData.append('font_size', this.fontSize);
        
        const customToken = this.customToken.value.trim();
        const tokenHint = this.tokenHint.value.trim();

        if (this.tokenInputContainer.style.display !== 'none' && customToken) {
            if (customToken.length < this.MIN_TOKEN_LENGTH) {
                alert(i18n.t('create.validation.tokenLength', { length: this.MIN_TOKEN_LENGTH }));
                return;
            }
            formData.append('token', customToken);
            if (tokenHint) {
                formData.append('token_hint', tokenHint);
            }
        }

        // Add images
        Array.from(this.images).forEach((file, index) => {
            formData.append(`images`, file);
        });
        
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        try {
            const now = Date.now();
            const minute = 60 * 1000;
            
            // Check browser limit
            let browserRequests = JSON.parse(sessionStorage.getItem('create_requests') || '[]');
            browserRequests = browserRequests.filter(time => (now - time) < minute);
            
            if (browserRequests.length >= 3) {
                throw new Error(i18n.t('create.errors.tooManyRequests'));
            }
            
            // Add new request timestamp
            browserRequests.push(now);
            sessionStorage.setItem('create_requests', JSON.stringify(browserRequests));
            
            // Disable button during upload
            this.createBtn.disabled = true;
            this.createBtn.textContent += '...';
            
            const response = await fetch('/api/message/create', {
                method: 'POST',
                body: formData
            });
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error(i18n.t('create.errors.networkError'));
            }
            
            if (!response.ok) {
                // Rate limiting (429)
                if (response.status === 429) {
                    const minutes = Math.ceil(data.detail?.wait_time / 60) || 1;
                    throw new Error(i18n.t('create.errors.TOO_MANY_REQUESTS', { minutes }));
                }
                
                // Handle error codes from backend (400, 500)
                if (data.detail?.code) {
                    throw new Error(i18n.t(`create.errors.${data.detail.code}`));
                }
                
                throw new Error(i18n.t('create.errors.createFailed'));
            }

            console.log('Server response:', { status: response.status, statusText: response.statusText, data: data });
            
            if (data.id) {  // Make sure we have a valid message ID
                // Only store data and redirect on success
                if (customToken) {
                    sessionStorage.setItem(`msg_token_${data.id}`, customToken);
                }
                sessionStorage.setItem('current_message_id', data.id);
                window.location.href = '/success';
            } else {
                throw new Error(i18n.t('create.errors.createFailed'));
            }
        } catch (error) {
            console.error('Error creating message:', error);
            this.createBtn.disabled = false;
            this.createBtn.textContent = i18n.t('create.createButton');
            alert(error.message || i18n.t('create.errors.networkError'));
        }
    }

    setupFontSizeControls() {
        const textarea = this.messageInput;
        const slider = $('#fontSize');
        
        setupSlider(slider, null, FONT_SIZES, (index) => {
            textarea.style.fontSize = FONT_SIZES[index];
            this.fontSize = index;
        });
    }
}

// Initialize
MessageCreator.initialize();
