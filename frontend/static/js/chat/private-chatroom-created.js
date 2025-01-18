import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize global features
    initSvgIcons();

    // Modify the existing room creation handler
    document.getElementById('createBtn').addEventListener('click', async () => {

        try {
            const response = await fetch('/api/chat/private_room/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 

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