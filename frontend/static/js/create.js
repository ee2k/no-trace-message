import { FONT_SIZES } from './constants.js';
import { $ } from './utils/dom.js';
import { setupSlider } from './utils/ui.js';
import { i18n } from './utils/i18n.js';

class MessageCreator {
    static async initialize() {
        await i18n.loadTranslations(i18n.currentLocale, null, 'common', 'share');
        i18n.updateTranslations();
        return new MessageCreator();
    }

    constructor() {        
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
        this.tokenHint = $('#tokenHint');
        
        this.MIN_TOKEN_LENGTH = 1;
        this.MAX_TOKEN_LENGTH = 70;
        
        this.TOKEN_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        this.TOKEN_LENGTH = 8;
        
        this.setupEventListeners();
        this.setupExpirySlider();
        this.setupBurnTimeSlider();
        this.setupTokenInput();
        this.setupTokenGenerator();
        this.setupFontSizeControls();
        this.setupCustomIDSection();
        
        this.initRateLimiting();
    }
    
    setupEventListeners() {
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

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
        
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        this.createBtn.addEventListener('click', () => this.createMessage());
    }
    
    setupExpirySlider() {
        const slider = $('#expiryTime');
        const valueDisplay = slider.parentElement.$('.slider-value');
        setupSlider(slider, valueDisplay, i18n.getExpiryTimes());
    }
    
    setupBurnTimeSlider() {
        const slider = $('#burnTime');
        const valueDisplay = slider.parentElement.$('.slider-value');
        setupSlider(slider, valueDisplay, i18n.getBurnTimes());
    }
    
    setupTokenInput() {
        this.customTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = !this.tokenInputContainer.classList.contains('show');
            
            this.customTokenBtn.classList.toggle('active');
            
            if (isHidden) {
                this.tokenInputContainer.style.display = 'block';
                setTimeout(() => {
                    this.tokenInputContainer.classList.add('show');
                }, 10);
            } else {
                this.tokenInputContainer.classList.remove('show');
                setTimeout(() => {
                    this.tokenInputContainer.style.display = 'none';
                }, 300);
                
                this.customToken.value = '';
                this.tokenHint.value = '';
            }
        });

        this.customToken.addEventListener('input', () => {
            if (this.customToken.value.length > 0 && this.customToken.value.length < this.MIN_TOKEN_LENGTH) {
                this.createBtn.disabled = true;
            } else {
                this.createBtn.disabled = false;
            }
        });
    }
    
    setupTokenGenerator() {
        const generateBtn = $('.generate-token');
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const token = this.generateReadableToken();
            this.customToken.value = token;
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
            this.fileInput.value = '';
            return;
        }
        
        Array.from(files).slice(0, this.MAX_IMAGES - this.images.size).forEach(file => {
            if (!this.ALLOWED_TYPES.includes(file.type)) {
                alert(i18n.t('create.validation.fileType').replace('{{type}}', file.type));
                this.fileInput.value = '';
                return;
            }
            
            if (file.size > this.MAX_IMAGE_SIZE) {
                alert(i18n.t('create.validation.fileSize').replace('{{size}}', this.MAX_IMAGE_SIZE / 1024 / 1024));
                this.fileInput.value = '';
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
                <button class="remove-btn"><svg><use href="static/images/close.svg#icon"></use></svg></button>
            `;
            
            preview.$('.remove-btn').addEventListener('click', () => {
                this.images.delete(file);
                preview.remove();
                this.fileInput.value = '';
            });
            
            this.imagePreviews.appendChild(preview);
            this.images.add(file);
        };
        reader.readAsDataURL(file);
    }
    
    initRateLimiting() {
        const now = Date.now();
        const minute = 60 * 1000;
        
        let browserRequests = JSON.parse(sessionStorage.getItem('create_requests') || '[]');
        browserRequests = browserRequests
            .filter(time => (now - time) < minute)
            .map(Number);
            
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
        
        const customIDElement = $('#customID');
        if (customIDElement) {
            const customIDBtn = $('#customIDBtn');
            if (customIDBtn && customIDBtn.classList.contains('active')) {
                const customIDValue = customIDElement.value.trim();
                if (!customIDValue) {
                    alert(i18n.t("create.validation.emptyCustomID"));
                    customIDElement.classList.add('input-error');
                    customIDElement.focus();
                    setTimeout(() => customIDElement.classList.remove('input-error'), 400);
                    return;
                }
                formData.append('custom_id', customIDValue);
            }
        }
        
        const customToken = this.customToken.value.trim();
        const tokenHint = this.tokenHint.value.trim();

        if (this.tokenInputContainer.style.display !== 'none') {
            if (!customToken || customToken.length < this.MIN_TOKEN_LENGTH) {
                alert(i18n.t('create.validation.emptyToken'));
                this.customToken.classList.add('input-error');
                this.customToken.focus();
                setTimeout(() => this.customToken.classList.remove('input-error'), 400);
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
            
            let browserRequests = JSON.parse(sessionStorage.getItem('create_requests') || '[]');
            browserRequests = browserRequests.filter(time => (now - time) < minute);
            
            if (browserRequests.length >= 3) {
                throw new Error(i18n.t('create.errors.tooManyRequests'));
            }
            
            browserRequests.push(now);
            sessionStorage.setItem('create_requests', JSON.stringify(browserRequests));
            
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
                if (data.detail?.code) {
                    throw new Error(i18n.t(`create.errors.${data.detail.code}`));
                }
                
                throw new Error(i18n.t('create.errors.createFailed'));
            }

            console.log('Server response:', { status: response.status, statusText: response.statusText, data: data });
            
            if (data.id) {
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
    
    setupCustomIDSection() {
        const customIDBtn = $('#customIDBtn');
        const idInputContainer = $('#idInputContainer');
        if (!customIDBtn || !idInputContainer) return;
        const customID = $('#customID');
        const idCounter = $('#idCounter');
        customIDBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = !idInputContainer.classList.contains('show');
            customIDBtn.classList.toggle('active');
            if (isHidden) {
                idInputContainer.style.display = 'block';
                setTimeout(() => {
                    idInputContainer.classList.add('show');
                }, 10);
            } else {
                idInputContainer.classList.remove('show');
                setTimeout(() => {
                    idInputContainer.style.display = 'none';
                    customID.value = '';
                    if (idCounter) idCounter.textContent = '70';
                }, 300);
            }
        });
    }
}

MessageCreator.initialize();
