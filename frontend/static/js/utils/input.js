import { reactiveState } from './reactiveState.js';

export function setupCounter(inputElement, counterElement, maxLength) {
    // Initialize reactive state
    const state = reactiveState({
        value: inputElement.value,
        remainingChars: maxLength - inputElement.value.length
    });

    // Function to update state
    const updateState = () => {
        const value = inputElement.value;
        state.set({
            value: value,
            remainingChars: maxLength - value.length
        });
    };

    // Listen for input events
    inputElement.addEventListener('input', updateState);

    // Override the value setter to trigger updates
    const elementType = inputElement instanceof HTMLInputElement ? 
        HTMLInputElement : 
        HTMLTextAreaElement;
        
    const originalDescriptor = Object.getOwnPropertyDescriptor(elementType.prototype, 'value');
    Object.defineProperty(inputElement, 'value', {
        set: function(value) {
            originalDescriptor.set.call(this, value);
            updateState();
        },
        get: function() {
            return originalDescriptor.get.call(this);
        }
    });

    // Subscribe to remainingChars changes
    state.watch('remainingChars', (remainingChars) => {
        counterElement.textContent = remainingChars;
    });

    // Set initial state
    updateState();

    // Return cleanup function
    return () => {
        inputElement.removeEventListener('input', updateState);
        Object.defineProperty(inputElement, 'value', originalDescriptor);
    };
} 