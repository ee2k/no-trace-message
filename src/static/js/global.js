// Initialize SVG icons
export const initSvgIcons = () => {
    document.querySelectorAll('[data-svg]').forEach(element => {
        const svgPath = element.dataset.svg;
        const svgClasses = element.dataset.svgClass?.split(' ') || [];
        loadSvg(element.id, svgPath, ...svgClasses);
    });
};

// Utility function to load SVG files
export const loadSvg = async (elementId, svgPath, ...classes) => {
    try {
        const response = await fetch(svgPath);
        const svgContent = await response.text();
        const element = document.getElementById(elementId);
        element.innerHTML = svgContent;
        const svg = element.querySelector('svg');
        svg.classList.add(...classes);
    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}; 