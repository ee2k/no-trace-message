import { $ } from '../utils/dom.js';
import { setupCounter } from '../utils/input.js';
import { setupSlider } from '../utils/ui.js';
import { i18n } from '../utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await i18n.loadTranslations(i18n.currentLocale, null, 'share', 'header');
        i18n.updateTranslations();

        // Setup max participants slider
        const maxParticipantsSlider = $('#maxParticipants');
        const maxParticipantsValue = maxParticipantsSlider.parentElement.$('.slider-value');
        const participantValues = ['2', '7'];
        
        setupSlider(maxParticipantsSlider, maxParticipantsValue, participantValues);

        // Setup custom ID section
        const customIDBtn = $('#customIDBtn');
        const idInputContainer = $('#idInputContainer');
        const customID = $('#customID');
        const idCounter = $('#idCounter');

        customIDBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = !idInputContainer.classList.contains('show');
            
            // Toggle button state
            customIDBtn.classList.toggle('active');
            
            // Show container before animation
            if (isHidden) {
                idInputContainer.style.display = 'block';
                setTimeout(() => {
                    idInputContainer.classList.add('show');
                }, 10);
            } else {
                idInputContainer.classList.remove('show');
                setTimeout(() => {
                    idInputContainer.style.display = 'none';
                    customID.value = ''; // Clear the textarea when folded
                    idCounter.textContent = 70; // Reset character counter
                }, 300);
            }
        });

        // Setup custom token section
        const customTokenBtn = $('#customTokenBtn');
        const tokenInputContainer = $('#tokenInputContainer');
        const customToken = $('#customToken');
        const tokenHint = $('#tokenHint');
        const tokenCounter = $('#tokenCounter');
        const hintCounter = $('#hintCounter');

        customTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = !tokenInputContainer.classList.contains('show');
            
            // Toggle button state
            customTokenBtn.classList.toggle('active');
            
            // Show container before animation
            if (isHidden) {
                tokenInputContainer.style.display = 'block';
                setTimeout(() => {
                    tokenInputContainer.classList.add('show');
                }, 10);
            } else {
                tokenInputContainer.classList.remove('show');
                setTimeout(() => {
                    tokenInputContainer.style.display = 'none';
                    customToken.value = ''; // Clear the textarea when folded
                    tokenCounter.textContent = 70; // Reset character counter
                    tokenHint.value = ''; // Clear token hint
                    hintCounter.textContent = 70; // Reset hint counter
                }, 300);
            }
        });

        // Setup character counters
        setupCounter(customID, idCounter, 70);
        setupCounter(customToken, tokenCounter, 70);
        setupCounter(tokenHint, hintCounter, 70);

        // Modify the existing room creation handler
        const createBtn = $('#createBtn');

        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const roomId = customID.value.trim();
            const token = customToken.value.trim();
            const tokenHintValue = tokenHint.value.trim();
            const maxParticipants = parseInt(maxParticipantsSlider.value);

            // Check if the user has chosen to use custom chatroom ID or token
            const isCustomIDActive = customIDBtn.classList.contains('active');
            const isCustomTokenActive = customTokenBtn.classList.contains('active');

            // Validate Custom Chatroom ID if toggle is active
            if (isCustomIDActive && !roomId) {
                alert(i18n.t("validation.emptyCustomID") || "Please enter a custom chatroom ID.");
                customID.classList.add('input-error');
                customID.focus();
                setTimeout(() => customID.classList.remove('input-error'), 400);
                return;
            }

            // Validate access token if toggle is active
            if (isCustomTokenActive && !token) {
                alert(i18n.t("validation.emptyToken") || "Please enter an access token.");
                customToken.classList.add('input-error');
                customToken.focus();
                setTimeout(() => customToken.classList.remove('input-error'), 400);
                return;
            }

            try {
                const response = await fetch('/api/chat/private_room/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        room_id: roomId || undefined,
                        room_token: token || undefined,
                        room_token_hint: tokenHintValue || undefined,
                        max_participants: maxParticipants
                    })
                });

                if (!response.ok) {
                    const contentType = response.headers.get('Content-Type') || '';
                    if (contentType.includes('application/json')) {
                        const responseData = await response.json();
                        let errorMessage = i18n.t("error.creationFailed");
                        
                        switch (responseData.detail.code) {
                            case 'ROOM_ID_EXISTS':
                                errorMessage = i18n.t("error.roomIdExists");
                                break;
                            case 'INVALID_ROOM_ID':
                                errorMessage = i18n.t("error.invalidRoomId");
                                break;
                            case 'INVALID_TOKEN':
                                errorMessage = i18n.t("error.invalidToken");
                                break;
                        }
                        alert(errorMessage);
                    } else {
                        alert("Failed to create room. " + response.status + " " + response.statusText);
                    }
                    return;
                }

                const data = await response.json();
                // Store data in sessionStorage before redirect
                sessionStorage.setItem('current_room_id', data.room_id);
                if (data.room_token) {
                    sessionStorage.setItem(`room_token_${data.room_id}`, data.room_token);
                }
                if (data.room_token_hint) {
                    sessionStorage.setItem(`room_token_hint_${data.room_id}`, data.room_token_hint);
                }
                window.location.href = '/private-chatroom-created';
            } catch (error) {
                console.error('Error creating room:', error);
                alert(i18n.t("error.creationFailed") || "Failed to create chatroom. Please try again.");
            }
        });
    } catch (error) {
        console.error("Error loading translations:", error);
    }
});