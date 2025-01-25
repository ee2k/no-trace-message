import { initSvgIcons } from './global.js';
import { loadComponent } from './utils/components.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load header component
    await loadComponent('headerComponent', '/components/header');
    await loadComponent('footerComponent', '/components/footer');
    // Initialize global features
    initSvgIcons();
});