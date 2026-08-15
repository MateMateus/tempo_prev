// Helpers para medição simples de performance

export function safeGetStartTime(entry) {
    return entry?.startTime ?? 0;
}

export function reportAllChanges(entries, callback) {
    if (!entries || typeof callback !== 'function') return;
    const list = Array.isArray(entries) ? entries : [entries];
    list.forEach(entry => {
        if (entry?.startTime !== undefined) {
            callback(entry);
        }
    });
}

export function initDefensivePerformanceGuard() {
    if (typeof window === 'undefined') return;

    if (!window.et) {
        window.et = {};
    }
    window.et.reportAllChanges = reportAllChanges;
    window.reportAllChanges = reportAllChanges;
}

