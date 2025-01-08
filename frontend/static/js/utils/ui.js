// UI-specific utilities
export const toggleVisibility = (element, show) => {
    element.style.display = show ? 'block' : 'none';
};

export const updateCharCounter = (input, counter, maxLength, options = {}) => {
    const {
        warningThreshold = 100,
        onValid = () => {},
        onInvalid = () => {},
    } = options;

    const remaining = maxLength - input.value.length;
    counter.textContent = remaining.toString();

    if (remaining <= warningThreshold) {
        counter.style.display = 'block';
        if (remaining < 0) {
            counter.classList.add('error');
            counter.classList.remove('warning');
            onInvalid(remaining);
        } else {
            counter.classList.add('warning');
            counter.classList.remove('error');
            onValid(remaining);
        }
    } else {
        counter.style.display = 'none';
        counter.classList.remove('warning', 'error');
        onValid(remaining);
    }
};

export const setupSlider = (slider, valueElement, values, onChange = () => {}) => {
    const updateSlider = () => {
        const index = parseInt(slider.value);
        if (valueElement) {  // Only update value display if element exists
            valueElement.textContent = values[index];
        }
        
        const progress = (index / (values.length - 1)) * 100;
        slider.style.setProperty('--slider-progress', `${progress}%`);
        
        onChange(index);
    };

    slider.addEventListener('input', updateSlider);
    updateSlider(); // Initial update
    
    return updateSlider;
}; 