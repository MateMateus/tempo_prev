import buscarNoMundo from "./api.js";
import { memoriaPermanente } from "./storageStrategy.js";

const storage = memoriaPermanente;

async function buscarServicos(url, params = {}, idRotulo = 'dados') {
    const searchParams = new URLSearchParams(params);
    const chaveCache = `${url}?${searchParams.toString()}`;

    // 1. Verifica se existe cache válido dentro do TTL de 30 minutos
    if (storage.existe(chaveCache)) {
        console.time(`[CACHE TTL 30m] Tempo de recuperação (${idRotulo})`);
        const resultadoEmCache = storage.buscarDadosLocal(chaveCache);
        console.timeEnd(`[CACHE TTL 30m] Tempo de recuperação (${idRotulo})`);
        return resultadoEmCache;
    }

    // 2. Caso não exista ou tenha expirado, busca da API pública
    console.time(`[REQUISIÇÃO API] Tempo para (${idRotulo})`);
    try {
        const resultadoDoServidor = await buscarNoMundo(url, params);
        storage.salvarDadosLocal(chaveCache, resultadoDoServidor);
        console.timeEnd(`[REQUISIÇÃO API] Tempo para (${idRotulo})`);
        return resultadoDoServidor;
    } catch (error) {
        console.timeEnd(`[REQUISIÇÃO API] Tempo para (${idRotulo})`);
        console.error(`[API CACHE] Erro ao carregar ${idRotulo}:`, error);
        throw error;
    }
}

export default buscarServicos;
