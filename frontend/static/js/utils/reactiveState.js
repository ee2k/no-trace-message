export const reactiveState = (initialState) => {
    let state = { ...initialState };
    const subscribers = new Set();
    let isUpdating = false;

    const notify = () => {
        if (isUpdating) return;
        isUpdating = true;
        try {
            subscribers.forEach(cb => cb(state));
        } finally {
            isUpdating = false;
        }
    };
    
    return {
        get: () => state,
        set: (newState) => {
            state = { ...state, ...newState };
            notify();
        },
        subscribe: (callback) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
        watch: (property, callback) => {
            const watcher = (state) => {
                if (property in state) {
                    callback(state[property]);
                }
            };
            subscribers.add(watcher);
            return () => subscribers.delete(watcher);
        }
    };
}; 