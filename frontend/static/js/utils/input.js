export function setupCounter(inputElement, counterElement, maxLength) {
    // Initialize counter with current remaining characters
    const updateCounter = () => {
        const remaining = maxLength - inputElement.value.length;
        counterElement.textContent = remaining;
    };
    
    // Set initial count
    updateCounter();
    
    // Update on input
    inputElement.addEventListener('input', updateCounter);
} 