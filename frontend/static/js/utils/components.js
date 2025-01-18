import { $ } from './dom.js';

export async function loadComponent(elementId, componentPath) {
    try {
        // Load HTML
        const htmlResponse = await fetch(`${componentPath}`);
        if (!htmlResponse.ok) throw new Error(`Failed to load component: ${componentPath}`);
        const html = await htmlResponse.text();
        
        // Load CSS
        const cssPath = `${componentPath.replace(componentPath, '/static/css' + componentPath)}.css`;
        await loadCSS(cssPath);
        
        // Insert HTML
        $('#' + elementId).innerHTML = html;
        
        // Re-initialize SVG icons if needed
        if (window.initSvgIcons) {
            window.initSvgIcons();
        }
        
        // Re-initialize i18n if needed
        if (window.initI18n) {
            window.initI18n();
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

function loadCSS(path) {
    return new Promise((resolve, reject) => {
        // Check if CSS is already loaded
        if ($(`link[href="${path}"]`)) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${path}`));
        
        document.head.appendChild(link);
    });
} 