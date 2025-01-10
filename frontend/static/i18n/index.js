class I18nManager {
  constructor() {
    this.currentLocale = this.detectLanguage();
    this.translations = new Map();
    this.defaultLocale = 'en';
  }

  detectLanguage() {
    // Check localStorage first
    const savedLocale = localStorage.getItem('preferred_language');
    if (savedLocale) return savedLocale;

    // Get browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang || this.defaultLocale;
  }

  async loadTranslations(locale) {
    if (!this.translations.has(locale)) {
      try {
        // Load common translations
        const commonModule = await import(`./${locale}/common.js`);
        
        // Load page-specific translations based on current page
        const pageName = window.location.pathname.split('/').pop() || 'create';
        const pageModule = await import(`./${locale}/pages/${pageName}.js`);
        
        // Merge translations
        this.translations.set(locale, {
          ...commonModule.default,
          ...pageModule.default
        });
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}, falling back to English`);
        if (locale !== this.defaultLocale) {
          await this.loadTranslations(this.defaultLocale);
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
}

export const i18n = new I18nManager();
