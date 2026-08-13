import buscarNoMundo from "./api.js";
import { memoriaPermanente } from "./storageStrategy.js";

const storage = memoriaPermanente;

async function buscarServicos(url, params = {}, idRotulo = 'dados') {
    const searchParams = new URLSearchParams(params);
    const chaveCache = `${url}?${searchParams.toString()}`;

    // 1. Verifica se existe cache válido dentro do TTL de 30 minutos
    if (storage.existe(chaveCache)) {
        return storage.buscarDadosLocal(chaveCache);
    }

    // 2. Caso não exista ou tenha expirado, busca da API pública
    try {
        const resultadoDoServidor = await buscarNoMundo(url, params);
        storage.salvarDadosLocal(chaveCache, resultadoDoServidor);
        return resultadoDoServidor;
    } catch (error) {
        console.error(`[API CACHE] Erro ao carregar ${idRotulo}:`, error);
        throw error;
    }
}

export default buscarServicos;
