import { i18n } from '../utils/i18n.js';
import { $ } from '../utils/dom.js';

export class LanguageSelector {
  constructor(containerId) {
    this.container = $(`#${containerId}`);
    this.supportedLanguages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'pt', name: 'Português' },
      { code: 'it', name: 'Italiano' },
      { code: 'ru', name: 'Русский' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'ar', name: 'العربية' },
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁體中文' }
    ];
    
    this.render();
    this.addEventListeners();
  }

  render() {
    const button = document.createElement('button');
    button.className = 'language-button';
    button.innerHTML = `<svg class="i18n-icon"><use href="static/images/i18n.svg#icon"></use></svg>`;
    
    const menu = document.createElement('div');
    menu.className = 'language-menu';
    
    this.supportedLanguages.forEach(lang => {
      const item = document.createElement('button');
      item.className = `language-item ${lang.code === i18n.currentLocale ? 'active' : ''}`;
      item.dataset.lang = lang.code;
      item.textContent = lang.name;
      menu.appendChild(item);
    });
    
    this.container.appendChild(button);
    this.container.appendChild(menu);
  }

  addEventListeners() {
    const button = $('.language-button', this.container);
    const menu = $('.language-menu', this.container);
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.classList.contains('show')) {
        menu.classList.remove('show');
      } else {
        menu.classList.add('show');
      }
    });

    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });

    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('language-item')) {
        i18n.setLocale(e.target.dataset.lang);
      }
    });
  }
} 