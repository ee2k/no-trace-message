import { $$ } from './dom.js';

class I18nManager {
  constructor() {
    this.currentLocale = this.detectLanguage();
    this.translations = new Map();
    this.defaultLocale = 'en';
  }

  detectLanguage() {
    const savedLocale = localStorage.getItem('preferred_language');
    if (savedLocale) return savedLocale;

    // Get browser language with region
    const [lang, region] = navigator.language.split('-');
    
    // Handle Chinese variants
    if (lang === 'zh') {
        // Default to zh-CN if no region specified
        if (!region) return 'zh-CN';
        // Map regions to supported variants
        const regionMap = {
            'CN': 'zh-CN',
            'SG': 'zh-CN',
            'TW': 'zh-TW',
            'HK': 'zh-TW',
            'MO': 'zh-TW'
        };
        return regionMap[region] || 'zh-CN';
    }

    return lang || this.defaultLocale;
  }

  /**
   * Loads the translations for the given locale and page.
   *
   * @param {string} locale - The locale to load.
   * @param {string|null} i18nFile - The page-specific key or file to load translations for.
   * @param {string|null} commonFile - Optional name of the common translations file (without the .js extension). If provided, it loads from ../../i18n/${locale}/${commonFile}.js.
   */
  async loadTranslations(locale, i18nFile = null, commonFile = null) {
    if (!this.translations.has(locale)) {
      try {
        let commonModule = {};
        if (commonFile) {
          commonModule = await import(`../../i18n/${locale}/${commonFile}.js`);
        }
        
        // Load page-specific translations based on current page or passed i18nFile
        const page = i18nFile || this.getCurrentPage();
        const pageModule = await import(`../../i18n/${locale}/pages/${page}.js`);
        
        // Merge the translations. If commonModule is not loaded, it simply does not contribute any keys.
        this.translations.set(locale, {
          ...((commonModule && commonModule.default) || {}),
          ...pageModule.default
        });
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}, falling back to English`);
        if (locale !== this.defaultLocale) {
          await this.loadTranslations(this.defaultLocale, i18nFile, commonFile);
        }
      }
    }
  }

  setLocale(locale) {
    this.currentLocale = locale;
    localStorage.setItem('preferred_language', locale);
    // Trigger page refresh to update all translations
    window.location.reload();
  }

  t(key) {
    // If no translations loaded for current locale, keep original text
    const translation = this.translations.get(this.currentLocale);
    if (!translation) return null;

    // Navigate the nested object using the key path
    const value = key.split('.').reduce((obj, k) => obj && obj[k], translation);
    
    // Return null if translation not found (to keep original text)
    return value || null;
  }

  updateTranslations() {
    $$('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = this.t(key);
        
        // Only update if we have a valid translation
        if (translation) {
            if (element.dataset.i18nHtml === 'true') {
                let translatedHtml = translation;
                translatedHtml = translatedHtml.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                    const urlTranslation = this.t(key);
                    return urlTranslation || match;
                });
                element.innerHTML = translatedHtml;
            } else {
                element.textContent = translation;
            }
        }
    });

    // Handle placeholders
    $$('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = this.t(key);
        if (translation) {
            element.placeholder = translation;
        }
    });

    // Handle titles
    $$('[data-i18n-title]').forEach(element => {
      const key = element.dataset.i18nTitle;
      const translation = this.t(key);
      if (translation) {
          element.title = translation;
      }
  });
  }

  getExpiryTimes() {
    return Array.from({ length: 7 }, (_, i) => this.t(`times.expiry.${i}`));
  }

  getBurnTimes() {
    return Array.from({ length: 7 }, (_, i) => this.t(`times.burn.${i}`));
  }

  getCurrentPage() {
    return window.location.pathname.split('/')[1];
  }
}

export const i18n = new I18nManager();
