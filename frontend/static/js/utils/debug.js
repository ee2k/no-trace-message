const IS_DEV_MODE = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('.local');

const debug = {
    log: (...args) => {
        if (IS_DEV_MODE) {
            console.log(...args);
        }
    },

    error: (...args) => {
        if (IS_DEV_MODE) {
            console.error(...args);
        }
    },

    warn: (...args) => {
        if (IS_DEV_MODE) {
            console.warn(...args);
        }
    }
};

export { debug };