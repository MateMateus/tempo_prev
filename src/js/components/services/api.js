async function buscarNoMundo(url, params = {}) {
    try {
        let finalUrl = url;
        
        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
        }

        const response = await fetch(finalUrl);
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`[API ERROR] Falha na chamada para ${url}:`, error);
        throw error;
    }
}

export default buscarNoMundo;
