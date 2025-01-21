import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';

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
    
    // Get room ID from URL path
    const pathParts = window.location.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    if (roomId) {
        $('#roomId').value = roomId;
        
        try {
            // Fetch room metadata
            const response = await fetch(`/api/chat/room/${roomId}/meta`);
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

    // Join room handler
    $('#joinBtn').addEventListener('click', async () => {
        const username = $('#username').value.trim();
        const roomIdValue = $('#roomId').value.trim();
        const tokenValue = $('#token').value.trim();

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
            const response = await fetch('/api/chat/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    room_id: roomIdValue,
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
                    // Add more cases as needed
                }
                
                alert(errorMessage);
                throw new Error(errorData.detail.code);
            }

            const data = await response.json();
            window.location.href = `/chatroom/${data.room_id}`;
        } catch (error) {
            console.error('Error joining room:', error);
            // Only show generic error if it's not a handled error code
            if (!error.message || !['INVALID_TOKEN', 'ROOM_NOT_FOUND'].includes(error.message)) {
                alert('Failed to join room. Please try again.');
            }
        }
    });
});