/**
 * Roteador SPA com Hooks de Ciclo de Vida Nativos (mount e unmount).
 * Garante desvinculação completa de memória, mapas Leaflet e ouvintes DOM antes de cada transição.
 */

import Logger from '../utils/logger.js';

class Router {
    constructor(rotas, containerId = 'app') {
        this.rotas = rotas;
        this.containerId = containerId;
        this.mapaDeRotas = {};
        this.rotaAtiva = null;
        this.container = null;

        this.init();
    }

    init() {
        for (const rota of this.rotas) {
            this.mapaDeRotas[rota.url] = rota;
        }

        window.addEventListener('hashchange', () => this.navigate());
    }

    getContainer() {
        if (!this.container) {
            this.container = document.getElementById(this.containerId);
        }
        return this.container;
    }

    async navigate() {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const appContainer = this.getContainer();

        let fullHash = window.location.hash || '#inicio';
        let baseHash = fullHash;
        let queryParams = {};

        // Suporte ao formato limpo #clima/nome-da-cidade
        if (fullHash.startsWith('#clima/')) {
            baseHash = '#inicio';
            const rawSlug = fullHash.substring(7).trim();
            const slug = rawSlug.split('?')[0].trim();
            if (slug) {
                queryParams.cidade = slug;
            }
        } else {
            const queryIndex = fullHash.indexOf('?');
            if (queryIndex !== -1) {
                baseHash = fullHash.substring(0, queryIndex);
                const queryString = fullHash.substring(queryIndex + 1);
                const urlParams = new URLSearchParams(queryString);
                for (const [key, value] of urlParams.entries()) {
                    queryParams[key] = value;
                }
            }
        }

        const proximaRota = this.mapaDeRotas[baseHash] || this.get404Route();

        // 1. Executa unmount na rota anterior
        if (this.rotaAtiva && typeof this.rotaAtiva.unmount === 'function') {
            try {
                Logger.spa(`[UNMOUNT] Descarregando rota anterior: ${this.rotaAtiva.url}`);
                this.rotaAtiva.unmount();
            } catch (e) {
                console.warn('[ROUTER] Erro ao descarregar rota anterior:', e);
            }
        } else if (this.rotaAtiva && typeof this.rotaAtiva.cleanup === 'function') {
            try {
                this.rotaAtiva.cleanup();
            } catch (e) {}
        }

        this.rotaAtiva = proximaRota;
        Logger.spa(`[MOUNT] Carregando rota: ${baseHash} ${queryParams.cidade ? `(${queryParams.cidade})` : ''}`);

        // Atualiza destaque no menu drawer
        document.querySelectorAll('.bem-drawer__link').forEach(link => {
            if (link.getAttribute('data-url') === baseHash) {
                link.classList.add('bem-drawer__link--active');
            } else {
                link.classList.remove('bem-drawer__link--active');
            }
        });

        if (appContainer) {
            appContainer.classList.remove('app-fade-in');
            void appContainer.offsetWidth;
            appContainer.classList.add('app-fade-in');
        }

        try {
            // 2. Executa mount na nova rota
            if (typeof proximaRota.mount === 'function') {
                await proximaRota.mount(appContainer, queryParams);
            } else if (typeof proximaRota.pagina === 'function') {
                await proximaRota.pagina(appContainer, queryParams);
            }
        } catch (err) {
            Logger.error('Erro ao renderizar rota', err);
            if (appContainer) {
                appContainer.innerHTML = `
                    <div class="cep-container" style="text-align: center; padding: 3rem 1rem;">
                        <h2 style="color: var(--accent-blue);">Ocorreu um erro ao carregar esta página</h2>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">${err.message || 'Erro inesperado'}</p>
                        <a href="#inicio" class="cep-btn" style="display: inline-flex; margin-top: 1.5rem;">Recarregar Dashboard</a>
                    </div>
                `;
            }
        }
    }

    get404Route() {
        return {
            url: '#404',
            mount: async (container) => {
                if (!container) return;
                container.innerHTML = `
                    <div class="cep-container" style="text-align: center; padding: 4rem 1rem;">
                        <h1 style="font-size: 3rem; color: var(--accent-blue);">404</h1>
                        <h2>Página Não Encontrada</h2>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">A rota solicitada não existe.</p>
                        <a href="#inicio" class="cep-btn" style="display: inline-flex; margin-top: 1.5rem;">Voltar ao Inicio</a>
                    </div>
                `;
            },
            unmount: () => {}
        };
    }
}

export default Router;
