import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';
import { loadComponent } from '../utils/components.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load header component
    await loadComponent('headerComponent', '/header');
    
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
            // Small delay to ensure display: block is applied
            setTimeout(() => {
                idInputContainer.classList.add('show');
            }, 10);
        } else {
            idInputContainer.classList.remove('show');
            // Hide after animation completes
            setTimeout(() => {
                idInputContainer.style.display = 'none';
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
            // Small delay to ensure display: block is applied
            setTimeout(() => {
                tokenInputContainer.classList.add('show');
            }, 10);
        } else {
            tokenInputContainer.classList.remove('show');
            // Hide after animation completes
            setTimeout(() => {
                tokenInputContainer.style.display = 'none';
            }, 300);
        }
    });

    // Setup character counters
    function setupCounter(textarea, counter, maxLength) {
        counter.textContent = maxLength;
        textarea.addEventListener('input', () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = remaining;
        });
    }

    setupCounter(customID, idCounter, 70);
    setupCounter(customToken, tokenCounter, 70);
    setupCounter(tokenHint, hintCounter, 70);

    // Modify the existing room creation handler
    document.getElementById('createBtn').addEventListener('click', async () => {
        const customRoomId = customID.value.trim();
        const token = customToken.value.trim();
        const hint = tokenHint.value.trim();

        try {
            const response = await fetch('/api/chat/private_room/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    custom_id: customRoomId || undefined,
                    token: token || undefined,
                    token_hint: hint || undefined
                })
            });

            if (!response.ok) throw new Error('Failed to create room');

            const data = await response.json();
            window.location.href = `/chat?room=${data.room_id}&token=${data.token}&show_share=true`;
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    });
});