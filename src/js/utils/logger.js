// Logger simples para desenvolvimento

export const Logger = {
    api(cidade) {
        console.log(`[API] Buscando clima para: ${cidade}`);
    },

    cacheHit(idRotulo, minutosRestantes) {
        console.log(`[Cache Hit] ${idRotulo} (expira em ${minutosRestantes} min)`);
    },

    cacheMiss(idRotulo) {
        console.log(`[Cache Miss] ${idRotulo} - Atualizando via API...`);
    },

    spa(rota) {
        console.log(`[Navegação] Rota: ${rota}`);
    },

    error(contexto, erro) {
        console.error(`[Erro] ${contexto}:`, erro);
    }
};

export default Logger;

