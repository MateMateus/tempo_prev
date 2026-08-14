/**
 * Utilitário de medição defensiva de performance e temporização.
 * Previne exceções Uncaught TypeError ao acessar propriedades como entry.startTime.
 */

export function safeGetStartTime(entry) {
    if (!entry || typeof entry?.startTime === 'undefined') {
        return 0;
    }
    return entry.startTime;
}

export function reportAllChanges(entries, callback) {
    if (!entries) return;
    try {
        const list = Array.isArray(entries) ? entries : [entries];
        list.forEach(entry => {
            if (entry && typeof entry?.startTime !== 'undefined') {
                if (typeof callback === 'function') {
                    callback(entry);
                }
            }
        });
    } catch (e) {
        console.warn('[PerformanceGuard] Exceção em reportAllChanges prevenida:', e);
    }
}

export function initDefensivePerformanceGuard() {
    if (typeof window === 'undefined') return;

    // Garantir que o namespace et e reportAllChanges fiquem seguros contra chamadas de terceiros
    if (!window.et) {
        window.et = {};
    }
    window.et.reportAllChanges = reportAllChanges;
    window.reportAllChanges = reportAllChanges;

    // Interceptador defensivo global contra Uncaught TypeError em startTime
    const originalError = window.onerror;
    window.onerror = function (msg, url, line, col, error) {
        if (typeof msg === 'string' && (msg.includes("startTime") || msg.includes("reportAllChanges") || msg.includes("reading 'startTime'"))) {
            console.warn('[PerformanceGuard] Exceção defensiva de startTime interceptada com sucesso:', msg);
            return true; // Previne exibição de exceção não tratada no console
        }
        if (typeof originalError === 'function') {
            return originalError.apply(this, arguments);
        }
        return false;
    };

    // Captura de rejeições de promessa não tratadas relativas a métricas
    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason && typeof e.reason.message === 'string' && (e.reason.message.includes('startTime') || e.reason.message.includes('reportAllChanges'))) {
            e.preventDefault();
            console.warn('[PerformanceGuard] Unhandled promise rejection interceptada com segurança:', e.reason.message);
        }
    });
}
