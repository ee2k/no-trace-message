import { i18n } from '../utils/i18n.js';

class NotFoundPage {
    static async initialize() {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.updateTranslations();
        return new NotFoundPage();
    }
}
NotFoundPage.initialize();