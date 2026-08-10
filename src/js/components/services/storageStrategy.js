const TTL_30_MINUTOS_MS = 30 * 60 * 1000; // 30 minutos em milissegundos

const memoriaTemporaria = {
    _cache: new Map(),

    existe(chave) {
        if (!this._cache.has(chave)) return false;

        const envelope = this._cache.get(chave);
        const agora = Date.now();
        const hojeStr = new Date().toISOString().split('T')[0];

        // Valida TTL de 30 minutos e virada de dia
        const estaExpirado = (agora - envelope.timestamp) > TTL_30_MINUTOS_MS;
        const mudouODia = envelope.dateStr !== hojeStr;

        if (estaExpirado || mudouODia) {
            console.log(`[STORAGE MEM] Cache expirado para a chave: ${chave} (Expirado: ${estaExpirado}, Novo Dia: ${mudouODia})`);
            this._cache.delete(chave);
            return false;
        }

        return true;
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
    existe(chave) {
        const itemStr = localStorage.getItem(chave);
        if (!itemStr) return false;

        try {
            const envelope = JSON.parse(itemStr);
            const agora = Date.now();
            const hojeStr = new Date().toISOString().split('T')[0];

            const estaExpirado = (agora - envelope.timestamp) > TTL_30_MINUTOS_MS;
            const mudouODia = envelope.dateStr !== hojeStr;

            if (estaExpirado || mudouODia) {
                console.log(`[STORAGE LOCAL] Cache expirado para a chave: ${chave} (Expirado: ${estaExpirado}, Novo Dia: ${mudouODia})`);
                localStorage.removeItem(chave);
                return false;
            }

            return true;
        } catch (e) {
            localStorage.removeItem(chave);
            return false;
        }
    },

    buscarDadosLocal(chave) {
        if (this.existe(chave)) {
            const itemStr = localStorage.getItem(chave);
            return JSON.parse(itemStr).data;
        }
        return null;
    },

    salvarDadosLocal(chave, valor) {
        const envelope = {
            timestamp: Date.now(),
            dateStr: new Date().toISOString().split('T')[0],
            data: valor
        };
        localStorage.setItem(chave, JSON.stringify(envelope));
    }
};

export { memoriaTemporaria, memoriaPermanente, TTL_30_MINUTOS_MS };
