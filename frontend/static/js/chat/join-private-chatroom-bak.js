import { checkBrowser } from '../utils/browser_check.js';
import { $ } from '../utils/dom.js';

const adjectives = [
    'Happy', 'Sad', 'Angry', 'Joyful', 'Fearful', 'Disgusted', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Gloomy', 'Boring', 'Sleepy', 'Grumpy', 'Lazy', 'Dreamy', 'Silly', 'Witty', 'Clumsy', 'Brave', 'Shy', 'Wild', 'Calm', 'Quiet', 'Loud', 'Gentle', 'Bold', 'Wise', 'Fancy', 'Neat', 'Smart', 'Crazy', 'Smartass'
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

// NEW HELPER FUNCTIONS TO SHOW/REMOVE ERROR FOR ROOM ID
function displayRoomIdError(message) {
    const roomIdInput = $('#roomId');
    roomIdInput.classList.add('input-error');
    let errorElem = document.getElementById('roomIdError');
    if (!errorElem) {
        errorElem = document.createElement('div');
        errorElem.id = 'roomIdError';
        errorElem.className = 'error-text';
        roomIdInput.parentNode.appendChild(errorElem);
    }
    errorElem.textContent = message;
}

function removeRoomIdError() {
    const roomIdInput = $('#roomId');
    roomIdInput.classList.remove('input-error');
    let errorElem = document.getElementById('roomIdError');
    if (errorElem) {
        errorElem.remove();
    }
}

// Helper function to fetch room metadata
async function fetchRoomMetadata(roomId) {
    try {
        const response = await fetch(`/api/chat/private_room/${roomId}/meta`);
        if (!response.ok) {
            if (response.status === 404) {
                displayRoomIdError('Room not found. Please check the room ID.');
                // Hide token sections if they were previously displayed
                $('#tokenSection').style.display = 'none';
                $('#tokenHintSection').style.display = 'none';
                return null;
            }
            throw new Error('Failed to fetch room metadata');
        }
        removeRoomIdError();
        return await response.json();
    } catch (error) {
        console.error('Error fetching room metadata:', error);
        displayRoomIdError('Failed to load room information. Please try again.');
        // Hide token sections in case of error
        $('#tokenSection').style.display = 'none';
        $('#tokenHintSection').style.display = 'none';
        return null;
    }
}

// Helper function to update token section visibility
function updateTokenSection(data) {
    if (data.token_required) {
        $('#tokenSection').style.display = 'block';
        if (data.token_hint) {
            $('#tokenHint').textContent = data.token_hint;
            $('#tokenHintSection').style.display = 'block';
        }
    } else {
        $('#tokenSection').style.display = 'none';
        $('#tokenHintSection').style.display = 'none';
    }
}

// Helper function to handle room metadata updates
async function handleRoomMetadata(roomId) {
    const data = await fetchRoomMetadata(roomId);
    if (data) {
        updateTokenSection(data);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Setup character counter for Room ID
    const roomIdInput = $('#roomId');
    let fetchTimeout;

    // Remove any error message as soon as the user types
    roomIdInput.addEventListener('input', async () => {
        removeRoomIdError();
        clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(async () => {
            const roomIdValue = roomIdInput.value.trim();
            if (!roomIdValue) return;
            await handleRoomMetadata(roomIdValue);
        }, 1000);
    });

    // Get room ID from URL path
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const isBaseRoute = pathParts.length === 1 && pathParts[0] === 'join-private-chatroom';
    const roomId = isBaseRoute ? null : pathParts[pathParts.length - 1];

    if (roomId) {
        roomIdInput.value = roomId;
        await handleRoomMetadata(roomId);
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
        const tokenValue = $('#room_token').value.trim();

        if (!roomIdValue) {
            $('#roomId').classList.add('input-error');
            $('#roomId').focus();
            setTimeout(() => {
                $('#roomId').classList.remove('input-error');
            }, 400);
            return;
        }

        if ($('#tokenSection').style.display !== 'none' && !tokenValue) {
            // Shake token input
            $('#room_token').classList.add('input-error');
            $('#room_token').focus();
            setTimeout(() => {
                $('#room_token').classList.remove('input-error');
            }, 400);
            return;
        }

        // Validate inputs
        if (!username) {
            $('#username').classList.add('input-error');
            $('#username').focus();
            setTimeout(() => {
                $('#username').classList.remove('input-error');
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
                    room_token: tokenValue || undefined
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
                        errorMessage = 'Room is full.';
                        break;
                }
                
                alert(errorMessage);
                return;
            }

            const data = await response.json();

            const userData = {
                user_id: data.user_id,
                username: username,
                room_id: roomIdValue,
                room_token: tokenValue || null
            };
            sessionStorage.setItem('chat_session', JSON.stringify(userData));

            window.location.href = `/chatroom/${data.room_id}`;
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
        }
    });
});

checkBrowser().then(() => {
    initJoinChatroom();
}).catch((error) => {
    console.error("Browser check failed in join-private-chatroom page:", error);
});