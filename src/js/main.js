import navbar from './components/navbar/navbar.js';
import footer from './components/footer/footer.js';
import roteador from './components/rotas/rotas.js';

// Init Navbar & Footer
navbar(roteador);
footer();

const app = document.getElementById('app');
const mapaDeRotas = {};

for (const rota of roteador) {
    mapaDeRotas[rota.url] = rota;
}

const rota404 = {
    pagina: async (container) => {
        container.innerHTML = `
            <div class="cep-container" style="text-align: center; padding: 4rem 1rem;">
                <h1 style="font-size: 3rem; color: var(--accent-blue);">404</h1>
                <h2>Página Não Encontrada</h2>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">A rota solicitada não existe.</p>
                <a href="#inicio" class="cep-btn" style="display: inline-flex; margin-top: 1.5rem;">Voltar ao Inicio</a>
            </div>
        `;
    }
};

async function render() {
    // Scroll ao topo no início da troca de rota
    window.scrollTo({ top: 0, behavior: 'instant' });

    let fullHash = window.location.hash || '#inicio';
    
    // Support query params in hash, e.g. #inicio?cidade=São%20Paulo
    const queryIndex = fullHash.indexOf('?');
    let baseHash = fullHash;
    let queryParams = {};
    
    if (queryIndex !== -1) {
        baseHash = fullHash.substring(0, queryIndex);
        const queryString = fullHash.substring(queryIndex + 1);
        const urlParams = new URLSearchParams(queryString);
        for (const [key, value] of urlParams.entries()) {
            queryParams[key] = value;
        }
    }
    
    const rotaAtual = mapaDeRotas[baseHash] || rota404;
    
    // Highlight active link in drawer
    document.querySelectorAll('.bem-drawer__link').forEach(link => {
        if (link.getAttribute('data-url') === baseHash) {
            link.classList.add('bem-drawer__link--active');
        } else {
            link.classList.remove('bem-drawer__link--active');
        }
    });

    if (app) {
        app.classList.remove('app-fade-in');
        // Force reflow for CSS animation reset
        void app.offsetWidth;
        app.classList.add('app-fade-in');
    }

    try {
        // Render Page with container and parameters
        await rotaAtual.pagina(app, queryParams);
    } catch (err) {
        console.error('[RENDER ERROR]', err);
        app.innerHTML = `
            <div class="cep-container" style="text-align: center; padding: 3rem 1rem;">
                <h2 style="color: var(--accent-blue);">Ocorreu um erro ao carregar esta página</h2>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">${err.message || 'Erro inesperado'}</p>
                <a href="#inicio" class="cep-btn" style="display: inline-flex; margin-top: 1.5rem;">Recarregar Dashboard</a>
            </div>
        `;
    }
}

// Global Event Listeners
window.addEventListener('hashchange', render);

// Initial Load Boot
render();
