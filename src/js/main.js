import navbar from './components/navbar/navbar.js';
import footer from './components/footer/footer.js';
import roteador from './components/rotas/rotas.js';
import { initDefensivePerformanceGuard } from './utils/performance.js';
import Router from './router/Router.js';

// Boot Global de Componentes e Roteador SPA
try {
    initDefensivePerformanceGuard();
    navbar(roteador);
    footer();

    const routerApp = new Router(roteador, 'app');
    routerApp.navigate();
} catch (bootErr) {
    console.error('[CRITICAL BOOT ERROR]', bootErr);
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="cep-container" style="text-align: center; padding: 4rem 1rem;">
                <h2 style="color: var(--accent-blue);">Ocorreu um erro ao inicializar a aplicação</h2>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">${bootErr.message || 'Falha ao carregar componentes.'}</p>
                <button onclick="window.location.reload()" class="cep-btn" style="display: inline-flex; margin-top: 1.5rem;">Recarregar Aplicação</button>
            </div>
        `;
    }
}
