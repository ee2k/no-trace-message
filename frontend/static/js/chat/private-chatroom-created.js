import { initSvgIcons } from '../global.js';
import { $, $$ } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global features
    initSvgIcons();

    // Get room details from sessionStorage
    const roomId = sessionStorage.getItem('current_room_id');
    if (!roomId) {
        alert('Room ID not found');
        return;
    }

    const token = sessionStorage.getItem(`room_token_${roomId}`);
    const tokenHint = sessionStorage.getItem(`room_token_hint_${roomId}`);

    // Base URL for the chat application
    const baseUrl = window.location.origin;
    
    // Set up all the links and information
    const baseLink = `${baseUrl}/join-private-chatroom`;
    const basicLink = `${baseLink}/${roomId}`;
    const fullLink = token 
        ? `${basicLink}?token=${token}`
        : basicLink;
    
    // Populate spans
    $('#fullLink').textContent = fullLink;
    $('#basicLink').textContent = basicLink;
    $('#baseLink').textContent = baseLink;
    $('#roomId').textContent = roomId;

    // Show/hide Basic Link Section based on token presence
    const basicLinkSection = $('.share-section:nth-child(2)'); // Second share-section
    if (token) {
        basicLinkSection.style.display = 'block';
        $('#roomToken').textContent = token;
    }

    // Handle token-related elements in Separate Info section
    const separateTokenBox = $('.token-box:last-child');
    if (token) {
        $('#separateToken').textContent = token;
        separateTokenBox.style.display = 'flex';
    }

    // Show/hide token hint section
    const tokenHintSection = $('#tokenHintSection');
    if (tokenHint) {
        $('#tokenHint').textContent = tokenHint;
        tokenHintSection.style.display = 'block';
    }

    // Setup copy buttons
    $$('.copy-btn').forEach(button => {
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
        $$('.share-btn').forEach(btn => {
            btn.style.display = 'flex';
            btn.addEventListener('click', async () => {
                const targetId = btn.previousElementSibling.dataset.clipboard;
                const text = $('#' + targetId).textContent;
                const title = 'Join Private Chatroom';
                
                try {
                    await navigator.share({
                        title: title,
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

    // Setup join button
    $('#joinBtn').addEventListener('click', () => {
        window.location.href = `/chatroom/${roomId}`;
    });

    // Clean up sessionStorage after successful load
    sessionStorage.removeItem('current_room_id');
    if (token) {
        sessionStorage.removeItem(`room_token_${roomId}`);
    }
    if (tokenHint) {
        sessionStorage.removeItem(`room_token_hint_${roomId}`);
    }
});