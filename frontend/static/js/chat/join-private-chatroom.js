import { checkBrowser } from '../utils/browser_check.js';
import { $ } from '../utils/dom.js';
import { i18n } from '../utils/i18n.js';
import { LanguageSelector } from '../components/languageSelector.js';

// Global constants for random username generation
const ADJECTIVES = [
  'Happy', 'Sad', 'Angry', 'Joyful', 'Fearful', 'Disgusted', 'Lucky',
  'Sunny', 'Clever', 'Swift', 'Gloomy', 'Boring', 'Sleepy', 'Grumpy',
  'Lazy', 'Dreamy', 'Silly', 'Witty', 'Clumsy', 'Brave', 'Shy', 'Wild',
  'Calm', 'Quiet', 'Loud', 'Gentle', 'Bold', 'Wise', 'Fancy', 'Neat',
  'Smart', 'Crazy', 'Smartass'
];

const NOUNS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat',
  'Monkey', 'Rooster', 'Dog', 'Pig', 'Cat', 'Panda', 'Eagle', 'Dolphin',
  'Fox', 'Wolf', 'Whale', 'Turtle', 'Giraffe', 'Lion', 'Bear', 'Penguin',
  'Koala', 'Elephant', 'Zebra', 'Deer', 'Jellyfish', 'Kangaroo', 'Crane',
  'Mantis', 'Pigeon', 'Seal', 'Viper', 'Tigeress', 'Vulture', 'Phoenix',
  'Unicorn', 'Griffin', 'Pegasus', 'Narwhal', 'Axolotl', 'Pangolin',
  'Platypus', 'Sloth', 'Otter', 'Raccoon', 'RedPanda', 'Tree', 'Sequoia',
  'Rose', 'Lily', 'Daisy', 'Sunflower', 'Tulip', 'Orchid', 'Daffodil',
  'Iris', 'Hyacinth', 'Dahlia', 'Poppy', 'Marigold', 'Poppy'
];

class JoinPrivateChatroomPage {
  static async initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new JoinPrivateChatroomPage());
    } else {
      new JoinPrivateChatroomPage();
    }
  }

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    // If a room ID is present in the URL path, trigger metadata load.
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const isBaseRoute =
      pathParts.length === 1 && pathParts[0] === 'join-private-chatroom';
    const roomId = isBaseRoute ? null : pathParts[pathParts.length - 1];
    if (roomId) {
      this.roomIdInput.value = decodeURIComponent(roomId);
      this.handleRoomMetadata(roomId);
    }
  }

  initializeElements() {
    this.roomIdInput = $('#roomId');
    this.usernameInput = $('#username');
    this.tokenInput = $('#room_token');
    this.generateBtn = $('#generateUsername');
    this.joinBtn = $('#joinBtn');
    this.tokenSection = $('#tokenSection');
    this.tokenHintSection = $('#tokenHintSection');
  }

  setupEventListeners() {
    let fetchTimeout;

    // Debounce room ID input so we don't flood the API
    this.roomIdInput.addEventListener('input', async () => {
      this.removeRoomIdError();
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(async () => {
        const roomIdValue = this.roomIdInput.value.trim();
        if (!roomIdValue) return;
        await this.handleRoomMetadata(roomIdValue);
      }, 1000);
    });

    // Remove error on username input
    this.usernameInput.addEventListener('input', (e) => {
      e.target.classList.remove('input-error');
    });

    // Generate random username using the globally defined arrays
    this.generateBtn.addEventListener('click', () => {
      const username =
        `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ` +
        `${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
      this.usernameInput.value = username;
    });

    // Join button handler
    this.joinBtn.addEventListener('click', async () => {
      await this.joinRoom();
    });
  }

  displayRoomIdError(message) {
    this.roomIdInput.classList.add('input-error');
    let errorElem = document.getElementById('roomIdError');
    if (!errorElem) {
      errorElem = document.createElement('div');
      errorElem.id = 'roomIdError';
      errorElem.className = 'error-text';
      this.roomIdInput.parentNode.appendChild(errorElem);
    }
    errorElem.textContent = message;
  }

  removeRoomIdError() {
    this.roomIdInput.classList.remove('input-error');
    const errorElem = document.getElementById('roomIdError');
    if (errorElem) {
      errorElem.remove();
    }
  }

  async fetchRoomMetadata(roomId) {
    try {
      const response = await fetch(`/api/chat/private_room/${roomId}/meta`);
      if (!response.ok) {
        if (response.status === 404) {
          this.displayRoomIdError(i18n.t("error.roomNotFound"));
          this.tokenSection.style.display = 'none';
          this.tokenHintSection.style.display = 'none';
          return null;
        }
        throw new Error('Failed to fetch room metadata');
      }
      this.removeRoomIdError();
      return await response.json();
    } catch (error) {
      console.error('Error fetching room metadata:', error);
      this.displayRoomIdError(i18n.t("error.joinFailed"));
      this.tokenSection.style.display = 'none';
      this.tokenHintSection.style.display = 'none';
      return null;
    }
  }

  async handleRoomMetadata(roomId) {
    const data = await this.fetchRoomMetadata(roomId);
    if (data) {
      this.updateTokenSection(data);
    }
  }

  updateTokenSection(data) {
    if (data.token_required) {
      this.tokenSection.style.display = 'block';
      if (data.token_hint) {
        // Assumes an element with id "tokenHint" exists.
        $('#tokenHint').textContent = data.token_hint;
        this.tokenHintSection.style.display = 'block';
      }
    } else {
      this.tokenSection.style.display = 'none';
      this.tokenHintSection.style.display = 'none';
    }
  }

  async joinRoom() {
    const username = this.usernameInput.value.trim();
    const roomIdValue = this.roomIdInput.value.trim();
    const tokenValue = this.tokenInput.value.trim();

    if (!roomIdValue) {
      this.roomIdInput.classList.add('input-error');
      this.roomIdInput.focus();
      setTimeout(() => {
        this.roomIdInput.classList.remove('input-error');
      }, 400);
      return;
    }

    if (this.tokenSection.style.display !== 'none' && !tokenValue) {
      this.tokenInput.classList.add('input-error');
      this.tokenInput.focus();
      setTimeout(() => {
        this.tokenInput.classList.remove('input-error');
      }, 400);
      return;
    }

    if (!username) {
      this.usernameInput.classList.add('input-error');
      this.usernameInput.focus();
      setTimeout(() => {
        this.usernameInput.classList.remove('input-error');
      }, 400);
      return;
    }

    try {
      const response = await fetch('/api/chat/private_room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomIdValue,
          user: { username: username },
          room_token: tokenValue || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = i18n.t("error.joinFailed");
        switch (errorData.detail.code) {
          case 'INVALID_TOKEN':
            errorMessage = i18n.t("error.invalidToken");
            break;
          case 'ROOM_NOT_FOUND':
            errorMessage = i18n.t("error.roomNotFound");
            break;
          case 'ROOM_FULL':
            errorMessage = i18n.t("error.roomFull");
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
        room_token: tokenValue || null,
      };
      sessionStorage.setItem('chat_session', JSON.stringify(userData));
      window.location.href = `/chatroom/${data.room_id}`;
    } catch (error) {
      console.error('Error joining room:', error);
      alert(i18n.t("error.joinFailed"));
    }
  }
}

// Rather than calling JoinPrivateChatroomPage.initialize() directly,
// wait for the DOM to be fully loaded. Then, check browser compatibility, load translations,
// initialize the language selector, and finally instantiate the chatroom page.
document.addEventListener('DOMContentLoaded', async () => {
  // Check browser compatibility first
  if (!(await checkBrowser())) return;

  // Load translations for the join-private-chatroom page using the current locale
  await i18n.loadTranslations(i18n.currentLocale, null, 'share', 'header');
  i18n.updateTranslations();
  
  // Initialize the language selector (ensure there's a container with id "languageSelector")
  new LanguageSelector('languageSelector');

  // Start the chatroom page initialization
  JoinPrivateChatroomPage.initialize();
});
