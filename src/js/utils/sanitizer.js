// Sanitização simples de HTML para prevenir injeções de script


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
