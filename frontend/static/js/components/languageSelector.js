import { i18n } from '../../i18n/index.js';
import { $ } from '../utils/dom.js';

export class LanguageSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.supportedLanguages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'zh', name: '中文' }
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
    
    button.addEventListener('click', () => {
      menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('language-item')) {
        i18n.setLocale(e.target.dataset.lang);
      }
    });
  }
} 