import { i18n } from './utils/i18n.js';
import { LanguageSelector } from './components/languageSelector.js';

class NotFoundPage {
    static async initialize() {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.updateTranslations();
        new LanguageSelector('languageSelector');
        return new NotFoundPage();
    }
}
NotFoundPage.initialize();