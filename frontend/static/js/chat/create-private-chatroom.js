import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';
import { loadComponent } from '../utils/components.js';
import { setupCounter } from '../utils/input.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load header component
    await loadComponent('headerComponent', '/components/header');
    
    // Initialize global features
    initSvgIcons();

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
    $('#createBtn').addEventListener('click', async () => {
        const customRoomId = customID.value.trim();
        const token = customToken.value.trim();
        const hint = tokenHint.value.trim();

        // Check if the user has chosen to use custom chatroom ID or token
        const isCustomIDActive = customIDBtn.classList.contains('active');
        const isCustomTokenActive = customTokenBtn.classList.contains('active');

        // Validation checks only if the corresponding toggle is active
        if (isCustomIDActive && !customRoomId) {
            alert('Please enter at least 1 char for Custom Chatroom ID.');
            return;
        }

        if (isCustomTokenActive && !token) {
            alert('Please enter at least 1 char for Access Token.');
            return;
        }

        try {
            const response = await fetch('/api/chat/private_room/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_id: customRoomId || undefined,
                    room_token: token || undefined,
                    room_token_hint: hint || undefined
                })
            });

            if (!response.ok) {
                const responseData = await response.json();
                let errorMessage = 'Failed to create room. Please try again.';
                
                switch (responseData.detail.code) {
                    case 'ROOM_ID_EXISTS':
                        errorMessage = 'This room ID is already taken. Please choose a different one.';
                        break;
                    case 'INVALID_ROOM_ID':
                        errorMessage = 'Invalid room ID format. Please try a different one.';
                        break;
                    case 'INVALID_TOKEN':
                        errorMessage = 'Invalid token format. Please try a different one.';
                        break;
                    // Add more cases as needed
                }
                
                alert(errorMessage);
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
            // Only show generic error if it's not a handled error code
            if (!error.message || !['ROOM_ID_EXISTS', 'INVALID_ROOM_ID', 'INVALID_TOKEN'].includes(error.message)) {
                alert('Failed to create room. Please try again.');
            }
        }
    });
});