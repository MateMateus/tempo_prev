/**
 * Utilitário de Logger Estruturado e Elegante para o DevTools.
 * Formata mensagens com cores CSS e emojis temáticos para monitoramento de API, Cache e SPA.
 */

const STYLES = {
    api: 'background: #1e3a8a; color: #93c5fd; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    cacheHit: 'background: #065f46; color: #a7f3d0; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    cacheMiss: 'background: #78350f; color: #fde68a; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    spa: 'background: #581c87; color: #e9d5ff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    error: 'background: #991b1b; color: #fecaca; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
};

export const Logger = {
    api(cidade) {
        console.log(`%c[API]%c 🌐 Buscando clima atualizado para: %c${cidade}`, STYLES.api, 'color: inherit;', 'font-weight: bold; color: var(--accent-blue, #3b82f6);');
    },

    cacheHit(idRotulo, minutosRestantes) {
        console.log(`%c[CACHE]%c ⚡ Dados recuperados do cache (%c${idRotulo}%c) [TTL restante: %c${minutosRestantes} min%c]`, 
            STYLES.cacheHit, 
            'color: inherit;', 
            'font-weight: bold; color: #10b981;', 
            'color: inherit;', 
            'font-weight: bold; color: #10b981;', 
            'color: inherit;'
        );
    },

    cacheMiss(idRotulo) {
        console.log(`%c[CACHE]%c 🔄 Cache expirado/inexistente (%c${idRotulo}%c). Renovando dados via API...`, 
            STYLES.cacheMiss, 
            'color: inherit;', 
            'font-weight: bold; color: #f59e0b;', 
            'color: inherit;'
        );
    },

    spa(rota) {
        console.log(`%c[SPA]%c 📍 Navegando para rota: %c${rota}`, STYLES.spa, 'color: inherit;', 'font-weight: bold; color: #a855f7;');
    },

    error(contexto, erro) {
        console.error(`%c[ERRO]%c ❌ ${contexto}:`, STYLES.error, 'color: inherit;', erro);
    }
};

export default Logger;
