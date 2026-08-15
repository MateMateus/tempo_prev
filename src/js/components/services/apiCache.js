import buscarNoMundo from "./api.js";
import { memoriaPermanente } from "./storageStrategy.js";
import Logger from "../../utils/logger.js";

const storage = memoriaPermanente;

async function buscarServicos(url, params = {}, idRotulo = 'dados') {
    const searchParams = new URLSearchParams(params);
    const chaveCache = `${url}?${searchParams.toString()}`;

    // 1. Verifica se existe cache válido dentro do TTL de 12 horas
    if (storage.existe(chaveCache)) {
        const minsRestantes = storage.obterMinutosRestantes(chaveCache);
        Logger.cacheHit(idRotulo, minsRestantes);
        return storage.buscarDadosLocal(chaveCache);
    }

    // 2. Caso não exista ou tenha expirado, busca da API pública
    Logger.cacheMiss(idRotulo);
    if (params.name) {
        Logger.api(params.name);
    } else if (idRotulo.startsWith('clima-')) {
        Logger.api(idRotulo.replace('clima-', ''));
    }

    try {
        const resultadoDoServidor = await buscarNoMundo(url, params);
        storage.salvarDadosLocal(chaveCache, resultadoDoServidor);
        return resultadoDoServidor;
    } catch (error) {
        Logger.error(`Erro ao carregar ${idRotulo}`, error);
        throw error;
    }
}

export default buscarServicos;
