import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';
import { setupCounter } from '../utils/input.js';

const adjectives = [
    'Happy', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Gloomy', 'Boring', 'Sleepy', 'Grumpy', 'Lazy', 'Dreamy', 'Silly', 'Witty', 'Clumsy', 'Brave', 'Shy', 'Wild', 'Calm', 'Quiet', 'Loud', 'Gentle', 'Bold', 'Wise', 'Fancy', 'Neat', 'Smart', 'Crazy', 'Smartass'
];

const nouns = [
    // Zodiac animals
    'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat','Monkey', 'Rooster','Dog','Pig',
    // Regular animals
    'Cat','Panda', 'Eagle', 'Dolphin', 'Fox', 'Wolf','Whale', 'Turtle', 'Giraffe', 'Lion', 'Bear','Penguin', 'Koala', 'Elephant', 'Zebra', 'Deer','Jellyfish','Kangaroo','Crane','Mantis','Pigeon','Seal','Viper','Tigeress','Vulture',
    // Rare/Exotic animals
    'Phoenix', 'Unicorn', 'Griffin', 'Pegasus','Narwhal', 'Axolotl', 'Pangolin', 'Platypus','Sloth', 'Otter', 'Raccoon', 'RedPanda',
    // Plant
    'Tree', 'Sequoia', 'Rose', 'Lily', 'Daisy', 'Sunflower', 'Tulip', 'Orchid', 'Daffodil', 'Iris', 'Hyacinth', 'Dahlia', 'Poppy', 'Marigold', 'Poppy',
];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global features
    initSvgIcons();
    
    // Setup character counter for Room ID
    setupCounter($('#roomId'), $('#roomIdCounter'), 70);

    // Get room ID from URL path
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty parts
    
    // Check if the path is exactly "/join-private-chatroom" or has a room ID
    const isBaseRoute = pathParts.length === 1 && pathParts[0] === 'join-private-chatroom';
    const roomId = isBaseRoute ? null : pathParts[pathParts.length - 1];

    if (roomId) {
        $('#roomId').value = roomId;
        
        try {
            // Fetch room metadata
            const response = await fetch(`/api/chat/private_room/${roomId}/meta`);
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Room not found. Please check the room ID.');
                    return;
                }
                throw new Error('Failed to fetch room metadata');
            }

            const data = await response.json();
            if (data.token_required) {
                $('#tokenSection').style.display = 'block';
                if (data.token_hint) {
                    $('#tokenHint').textContent = data.token_hint;
                    $('#tokenHintSection').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error fetching room metadata:', error);
            alert('Failed to load room information. Please try again.');
            return;
        }
    }

    // Username input error handling
    $('#username').addEventListener('input', (e) => {
        e.target.classList.remove('input-error');
    });

    // Generate random username
    $('#generateUsername').addEventListener('click', () => {
        const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        $('#username').value = username;
    });

    // Join button handler
    $('#joinBtn').addEventListener('click', async () => {
        const username = $('#username').value.trim();
        const roomIdValue = $('#roomId').value.trim();
        const tokenValue = $('#token').value.trim();

        // Validate inputs
        if (!username) {
            $('#username').classList.add('input-error');
            $('#username').focus();
            setTimeout(() => {
                $('#username').classList.remove('input-error');
            }, 400);
            return;
        }

        if (!roomIdValue) {
            $('#roomId').classList.add('input-error');
            $('#roomId').focus();
            setTimeout(() => {
                $('#roomId').classList.remove('input-error');
            }, 400);
            return;
        }

        try {
            const response = await fetch('/api/chat/private_room/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_id: roomIdValue,
                    user: {
                        username: username
                    },
                    token: tokenValue || undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'Failed to join room. Please try again.';
                
                switch (errorData.detail.code) {
                    case 'INVALID_TOKEN':
                        errorMessage = 'Invalid access token. Please check and try again.';
                        break;
                    case 'ROOM_NOT_FOUND':
                        errorMessage = 'Room not found. Please check the room ID.';
                        break;
                    case 'ROOM_FULL':
                        errorMessage = 'Room is full. Maximum 2 participants allowed.';
                        break;
                }
                
                alert(errorMessage);
                return;
            }

            const data = await response.json();            
            // Redirect to the chatroom page
            window.location.href = `/chatroom/${data.room_id}`;
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
        }
    });
});