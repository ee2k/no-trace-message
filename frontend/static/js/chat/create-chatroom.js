import { initSvgIcons } from '../global.js';

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

    // Handle room creation
    document.getElementById('createBtn').addEventListener('click', async () => {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        
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
                body: JSON.stringify({ username })
            });

            if (!response.ok) throw new Error('Failed to create room');

            const data = await response.json();
            // Redirect to chat room with auto-show share parameter
            window.location.href = `/chat?room=${data.room_id}&token=${data.token}&show_share=true`;
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    });
});