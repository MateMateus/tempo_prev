const TTL_15_MINUTOS_MS = 15 * 60 * 1000; // 15 minutos em milissegundos

const memoriaTemporaria = {
    _cache: new Map(),

    existe(chave) {
        if (!this._cache.has(chave)) return false;

        const envelope = this._cache.get(chave);
        const agora = Date.now();
        const hojeStr = new Date().toISOString().split('T')[0];

        // Valida TTL de 15 minutos e virada de dia
        const estaExpirado = (agora - envelope.timestamp) > TTL_15_MINUTOS_MS;
        const mudouODia = envelope.dateStr !== hojeStr;

        if (estaExpirado || mudouODia) {
            this._cache.delete(chave);
            return false;
        }

        return true;
    },

    obterMinutosRestantes(chave) {
        if (!this._cache.has(chave)) return 0;
        const envelope = this._cache.get(chave);
        const passado = Date.now() - envelope.timestamp;
        const restanteMs = Math.max(0, TTL_15_MINUTOS_MS - passado);
        return Math.ceil(restanteMs / 60000);
    },

    buscarDadosLocal(chave) {
        if (this.existe(chave)) {
            return this._cache.get(chave).data;
        }
        return null;
    },

    salvarDadosLocal(chave, valor) {
        const envelope = {
            timestamp: Date.now(),
            dateStr: new Date().toISOString().split('T')[0],
            data: valor
        };
        this._cache.set(chave, envelope);
    }
};

const memoriaPermanente = {
    _testarLocalStorage() {
        try {
            const testKey = '__test_storage__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    existe(chave) {
        if (!this._testarLocalStorage()) {
            return memoriaTemporaria.existe(chave);
        }
        try {
            const itemStr = localStorage.getItem(chave);
            if (!itemStr) return memoriaTemporaria.existe(chave);

            const envelope = JSON.parse(itemStr);
            const agora = Date.now();
            const hojeStr = new Date().toISOString().split('T')[0];

            const estaExpirado = (agora - envelope.timestamp) > TTL_15_MINUTOS_MS;
            const mudouODia = envelope.dateStr !== hojeStr;

            if (estaExpirado || mudouODia) {
                localStorage.removeItem(chave);
                return false;
            }

            return true;
        } catch (e) {
            return memoriaTemporaria.existe(chave);
        }
    },

    obterMinutosRestantes(chave) {
        if (!this._testarLocalStorage()) {
            return memoriaTemporaria.obterMinutosRestantes(chave);
        }
        try {
            const itemStr = localStorage.getItem(chave);
            if (!itemStr) return memoriaTemporaria.obterMinutosRestantes(chave);
            const envelope = JSON.parse(itemStr);
            const passado = Date.now() - envelope.timestamp;
            const restanteMs = Math.max(0, TTL_15_MINUTOS_MS - passado);
            return Math.ceil(restanteMs / 60000);
        } catch (e) {
            return memoriaTemporaria.obterMinutosRestantes(chave);
        }
    },

    buscarDadosLocal(chave) {
        if (this.existe(chave)) {
            if (this._testarLocalStorage() && localStorage.getItem(chave)) {
                try {
                    return JSON.parse(localStorage.getItem(chave)).data;
                } catch (e) {}
            }
            return memoriaTemporaria.buscarDadosLocal(chave);
        }
        return null;
    },

    salvarDadosLocal(chave, valor) {
        // Garante salvamento em RAM como fallback transparente
        memoriaTemporaria.salvarDadosLocal(chave, valor);

        if (!this._testarLocalStorage()) return;

        const envelope = {
            timestamp: Date.now(),
            dateStr: new Date().toISOString().split('T')[0],
            data: valor
        };
        try {
            localStorage.setItem(chave, JSON.stringify(envelope));
        } catch (e) {
            console.warn('[STORAGE] QuotaExceededError no localStorage. Purgando chaves antigas...');
            try {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (k && (k.startsWith('clima-') || k.startsWith('geocoding-') || k.startsWith('viacep-'))) {
                        this.existe(k);
                    }
                }
                localStorage.setItem(chave, JSON.stringify(envelope));
            } catch (errRetry) {
                console.warn('[STORAGE] Persistência mantida com sucesso em RAM:', chave);
            }
        }
    }
};

export { memoriaTemporaria, memoriaPermanente, TTL_15_MINUTOS_MS };
