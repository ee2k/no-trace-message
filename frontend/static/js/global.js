import { $, $$ } from './utils/dom.js';

// Initialize SVG icons
export const initSvgIcons = () => {
    $$('[data-svg]').forEach(element => {
        const svgPath = element.dataset.svg;
        const svgClasses = element.dataset.svgClass?.split(' ') || [];
        loadSvg(element.id, svgPath, ...svgClasses);
    });
};

const svgCache = new Map();

async function loadSvg(elementId, svgPath, ...classes) {
    if (svgCache.has(svgPath)) {
        // Use cached SVG
        const svgContent = svgCache.get(svgPath);
        updateSvgElement(elementId, svgContent, classes);
        return;
    }

    try {
        const response = await fetch(svgPath);
        if (!response.ok) throw new Error('Failed to load SVG');
        const svgContent = await response.text();
        
        // Cache the SVG content
        svgCache.set(svgPath, svgContent);
        
        // Update the DOM
        updateSvgElement(elementId, svgContent, classes);
    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}

function updateSvgElement(elementId, svgContent, classes) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.innerHTML = svgContent;
    const svg = element.querySelector('svg');
    if (svg) {
        svg.classList.add(...classes);
    }
} 