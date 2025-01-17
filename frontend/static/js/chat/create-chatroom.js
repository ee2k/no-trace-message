import { initSvgIcons } from '../global.js';
import { $ } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize global features
    initSvgIcons();
    
    // Initialize page-specific features
    document.getElementById('username').addEventListener('input', (e) => {
        e.target.classList.remove('input-error');
    });

    const generateUsername = document.getElementById('generateUsername');

    // Generate random username
    generateUsername.addEventListener('click', () => {
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
        
        const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        document.getElementById('username').value = username;
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

    // Modify the existing room creation handler
    document.getElementById('createBtn').addEventListener('click', async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        const customRoomId = customID.value.trim();
        const token = customToken.value.trim();
        const hint = tokenHint.value.trim();
        
        if (!username) {
            usernameInput.classList.add('input-error');
            usernameInput.focus();
            setTimeout(() => {
                usernameInput.classList.remove('input-error');
            }, 400);
            return;
        }

        try {
            const response = await fetch('/api/private/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username,
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