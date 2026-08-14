/**
 * Utilitário de Sanitização contra ataques Cross-Site Scripting (XSS).
 * Escapa caracteres especiais de HTML para garantir injeção segura de dados externos no DOM.
 */

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const stringVal = String(str);
    return stringVal
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export default escapeHtml;
