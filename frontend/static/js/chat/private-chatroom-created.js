import { $, $$ } from '../utils/dom.js';
import { i18n } from '../utils/i18n.js';
import { prettyEncodeURL } from '../utils/url.js'
import { setupCopyButtons, setupShareButtons } from '../utils/copy-share.js';

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
        alert(i18n.t("pagei18n.error.roomIdNotFound") || "Room ID not found");
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
    setupCopyButtons();

    // Setup share buttons
    setupShareButtons();

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