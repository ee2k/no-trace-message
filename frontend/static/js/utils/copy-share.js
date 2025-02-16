import { $, $$ } from './dom.js';
import { i18n } from './i18n.js';

function createShareData(element) {
    const content = element.textContent;
    const titleKey = element.dataset.shareTitle;
    const instructionKey = element.dataset.shareInstruction;
    
    const title = titleKey ? i18n.t(titleKey) : '';
    const instruction = instructionKey ? i18n.t(instructionKey) : '';
    
    const prefix = `${title ? `${title}\n` : ''}${instruction ? `${instruction}\n` : ''}`;
    return prefix ? `${prefix}\n${content}` : content;
}

export function setupCopyButtons() {
    $$('.copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.dataset.clipboard;
            const element = $('#' + targetId);
            if (!element) {
                console.error('Target element not found for:', targetId);
                return;
            }
            
            const text = createShareData(element);
            
            try {
                await navigator.clipboard.writeText(text);
                
                const normalContent = $('.btn-content', button);
                const copiedContent = $('.btn-content-copied', button);
                
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

export function setupShareButtons() {
    if (!navigator.share) {
        return;
    }

    $$('.share-btn').forEach(btn => {
        btn.style.display = 'flex';
        btn.addEventListener('click', async () => {
            const targetId = btn.previousElementSibling.dataset.clipboard;
            const element = $('#' + targetId);
            if (!element) {
                console.error('Target element not found for:', targetId);
                return;
            }
            
            const text = createShareData(element);
            
            try {
                await navigator.share({
                    text: text
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        });
    });
}

export function setupBurnMessageButtons() {
    $$('.burn-message-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.parentElement.previousElementSibling.id;
            const element = $('#' + targetId);
            if (!element) {
                console.error('Target element not found for:', targetId);
                return;
            }
            
            const text = createShareData(element);
            sessionStorage.setItem('burn_message_content', text);
            window.open('/create', '_blank');
        });
    });
}
