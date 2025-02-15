import { $, $$ } from '../utils/dom.js';
import { i18n } from '../utils/i18n.js';
import { prettyEncodeURL } from '../utils/url.js'

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.updateTranslations();
    } catch (error) {
        console.error("Error loading translations:", error);
    }
    
    // Get room details from sessionStorage
    const roomId = sessionStorage.getItem('current_room_id');
    if (!roomId) {
        alert(i18n.t("privateChatroomCreated.error.roomIdNotFound") || "Room ID not found");
        return;
    }

    const token = sessionStorage.getItem(`room_token_${roomId}`);
    const tokenHint = sessionStorage.getItem(`room_token_hint_${roomId}`);

    // Base URL for the chat application
    const baseUrl = window.location.origin;
    
    // Set up all the links and information
    const baseLink = `${baseUrl}/join-private-chatroom`;
    const basicLink = `${baseLink}/${prettyEncodeURL(roomId)}`;
    
    // Populate spans
    $('#basicLink').textContent = basicLink;
    $('#baseLink').textContent = baseLink;
    $('#roomId').textContent = roomId;

    // Get all required elements
    const basicTokenBox = $('#basicTokenBox');
    const tokenHintSection = $('#tokenHintSection');

    // Handle token display if present
    if (token) {
        // Show token in Basic Link Section
        basicTokenBox.style.display = 'flex';
        $('#roomToken').textContent = token;

        // Show token in Separate Info Section
        $('.token-box', $('#separateInfoSection')).style.display = 'flex';
        $('#separateToken').textContent = token;

        if (tokenHint) {
            // Show token hint in Basic Link Section
            $('#tokenHint').textContent = tokenHint;
            tokenHintSection.style.display = 'block';

            // Show token hint in Separate Info Section
            $('#separateTokenHint').textContent = tokenHint;
            $('#separateTokenHintSection').style.display = 'block';
        }
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
                const shareTitle = i18n.t("privateChatroomCreated.shareTitle") || "Join Private Chatroom";
                
                try {
                    await navigator.share({
                        title: shareTitle,
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
        window.location.href = `/join-private-chatroom/${roomId}`;
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