// Estado simples da aplicação e sistema PubSub


const state = {
    theme: localStorage.getItem('tempo_prev_theme') || 'light',
    currentCity: 'São Paulo, BR',
    currentWeather: null
};

const listeners = new Map();

export const Store = {
    get(key) {
        return state[key];
    },

    set(key, value) {
        if (state[key] === value) return;
        state[key] = value;

        if (key === 'theme') {
            try {
                localStorage.setItem('tempo_prev_theme', value);
            } catch (e) {}
            document.documentElement.setAttribute('data-theme', value);
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: value } }));
        }

        this.notify(key, value);
    },

    subscribe(key, callback) {
        if (!listeners.has(key)) {
            listeners.set(key, new Set());
        }
        listeners.get(key).add(callback);

        return () => {
            if (listeners.has(key)) {
                listeners.get(key).delete(callback);
            }
        };
    },

    notify(key, value) {
        if (listeners.has(key)) {
            listeners.get(key).forEach(callback => {
                try {
                    callback(value, state);
                } catch (err) {
                    console.error(`[STORE ERROR] Listener da chave ${key} falhou:`, err);
                }
            });
        }
    }
};

export default Store;
