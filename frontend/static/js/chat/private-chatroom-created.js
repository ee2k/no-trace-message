import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global features
    initSvgIcons();

    // Get room details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    const token = urlParams.get('token');
    const tokenHint = urlParams.get('hint');

    // Base URL for the chat application
    const baseUrl = window.location.origin;
    
    // Set up all the links and information
    const fullLink = `${baseUrl}/join-chatroom/${roomId}?token=${token}`;
    const basicLink = `${baseUrl}/join-chatroom/${roomId}`;
    
    // Populate spans
    $('#fullLink').textContent = fullLink;
    $('#basicLink').textContent = basicLink;
    $('#roomToken').textContent = token;
    $('#baseLink').textContent = `${baseUrl}/join-chatroom`;
    $('#roomId').textContent = roomId;
    $('#separateToken').textContent = token;

    // Show/hide token hint section based on whether it exists
    const tokenHintSection = $('#tokenHintSection');
    if (tokenHint) {
        $('#tokenHint').textContent = tokenHint;
        tokenHintSection.style.display = 'block';
    }

    // Setup copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.dataset.clipboard;
            const text = $('#' + targetId).textContent;
            
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

    // Setup share buttons if Web Share API is available
    if (navigator.share) {
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.style.display = 'flex';
            btn.addEventListener('click', async () => {
                const targetId = btn.previousElementSibling.dataset.clipboard;
                const text = $('#' + targetId).textContent;
                
                try {
                    await navigator.share({
                        title: 'Join Private Chatroom',
                        text: 'Join me in this private chat room',
                        url: text
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Error sharing:', err);
                    }
                }
            });
        });
    }

    // Setup join button
    $('#joinBtn').addEventListener('click', () => {
        window.location.href = `/chat?room=${roomId}&token=${token}`;
    });
});