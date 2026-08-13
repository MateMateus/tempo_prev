import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { obterLocalizacaoGPS } from "../../utils/geolocation.js";

function salvarCidadeRecente(cidade) {
    if (!cidade) return;
    try {
        let recentes = JSON.parse(localStorage.getItem('tempo_prev_recentes') || '[]');
        recentes = recentes.filter(c => c.toLowerCase() !== cidade.toLowerCase());
        recentes.unshift(cidade);
        if (recentes.length > 5) recentes = recentes.slice(0, 5);
        localStorage.setItem('tempo_prev_recentes', JSON.stringify(recentes));
    } catch (e) {
        console.error("Erro ao salvar cidade recente:", e);
    }
}

function obterCidadesRecentes() {
    try {
        return JSON.parse(localStorage.getItem('tempo_prev_recentes') || '[]');
    } catch (e) {
        return [];
    }
}

function navbar(rotas) {
    const header = document.getElementById('navbar');
    if (!header) return;
    
    const savedTheme = localStorage.getItem('tempo_prev_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    header.innerHTML = `
        <nav class="bem-navbar">
            <div class="bem-navbar__container">
                <div class="bem-navbar__left">
                    <button id="btn-toggle-menu" class="bem-navbar__toggle" title="Abrir Menu" aria-label="Abrir Menu de Navegação">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                    <a href="#inicio" class="bem-navbar__brand">
                        <span class="bem-navbar__brand-icon">${SVG_ICONS.brandLogo}</span>
                        <span>Tempo Prev</span>
                    </a>
                </div>

                <div class="bem-navbar__center" id="navbar-search-center">
                    <form id="form-busca-rapida" class="bem-navbar__search" autocomplete="off">
                        <span class="bem-navbar__search-icon">${SVG_ICONS.search}</span>
                        <input type="text" id="input-busca-rapida" class="bem-navbar__search-input" placeholder="Pesquisar cidade brasileira (ex: São Paulo, Rio, Salvador)..." aria-label="Pesquisar Cidade" />
                        <div id="autocomplete-dropdown" class="bem-navbar__autocomplete"></div>
                    </form>
                </div>

                <div class="bem-navbar__right">
                    <!-- Botão de Busca Dedicado no Mobile -->
                    <button id="btn-search-mobile" class="bem-navbar__theme-btn bem-navbar__search-mobile-btn btn-search-mobile mobile-search-btn" title="Pesquisar Cidade" aria-label="Abrir Busca">
                        ${SVG_ICONS.search}
                    </button>

                    <!-- Botão de GPS em 1-Clique -->
                    <button id="btn-gps-location" class="bem-navbar__theme-btn" title="Usar minha localização GPS atual" aria-label="Usar minha localização GPS">
                        🎯
                    </button>

                    <button id="btn-toggle-theme" class="bem-navbar__theme-btn" title="Alternar Tema" aria-label="Alternar Tema Dark/Light">
                        ${savedTheme === 'dark' ? SVG_ICONS.sun : SVG_ICONS.moon}
                    </button>
                    
                    <div class="bem-navbar__location-badge" id="navbar-location-badge">
                        ${SVG_ICONS.location} <span id="current-location-text">São Paulo, BR</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Off-canvas Menu Drawer -->
        <div id="drawer-overlay" class="bem-drawer__overlay"></div>
        <aside id="drawer-menu" class="bem-drawer">
            <div class="bem-drawer__header">
                <div class="bem-navbar__brand">
                    <span class="bem-navbar__brand-icon">${SVG_ICONS.brandLogo}</span>
                    <span>Tempo Prev</span>
                </div>
                <button id="btn-close-drawer" class="bem-drawer__close" aria-label="Fechar Menu">&times;</button>
            </div>
            
            <ul class="bem-drawer__menu">
                ${rotas.map(rota => `
                    <li>
                        <a href="${rota.url}" class="bem-drawer__link" data-url="${rota.url}">
                            <span class="bem-drawer__icon">${rota.icone || SVG_ICONS.location}</span>
                            <span>${rota.label}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </aside>
    `;

    initNavbarEvents();
}

function initNavbarEvents() {
    const toggleBtn = document.getElementById('btn-toggle-menu');
    const closeBtn = document.getElementById('btn-close-drawer');
    const drawer = document.getElementById('drawer-menu');
    const overlay = document.getElementById('drawer-overlay');
    const themeBtn = document.getElementById('btn-toggle-theme');
    const gpsBtn = document.getElementById('btn-gps-location');
    const searchMobileBtn = document.getElementById('btn-search-mobile');
    const searchForm = document.getElementById('form-busca-rapida');
    const searchInput = document.getElementById('input-busca-rapida');
    const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

    const openDrawer = () => {
        if (drawer) drawer.classList.add('bem-drawer--open');
        if (overlay) overlay.classList.add('bem-drawer__overlay--active');
    };

    const closeDrawer = () => {
        if (drawer) drawer.classList.remove('bem-drawer--open');
        if (overlay) overlay.classList.remove('bem-drawer__overlay--active');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.querySelectorAll('.bem-drawer__link').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    if (searchMobileBtn && searchInput) {
        searchMobileBtn.addEventListener('click', () => {
            const centerNav = document.getElementById('navbar-search-center');
            if (centerNav) {
                centerNav.classList.toggle('bem-navbar__center--mobile-active');
            }
            searchInput.focus();
        });
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('tempo_prev_theme', newTheme);
            themeBtn.innerHTML = newTheme === 'dark' ? SVG_ICONS.sun : SVG_ICONS.moon;
            
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }

    if (gpsBtn) {
        gpsBtn.addEventListener('click', async () => {
            const origIcon = gpsBtn.innerHTML;
            gpsBtn.innerHTML = '⏳';
            gpsBtn.disabled = true;

            try {
                const loc = await obterLocalizacaoGPS();
                salvarCidadeRecente(loc.cidade);
                window.location.hash = `#inicio?cidade=${encodeURIComponent(loc.cidade)}`;
            } catch (err) {
                alert(err.message || "Erro ao obter localização GPS.");
            } finally {
                gpsBtn.innerHTML = origIcon;
                gpsBtn.disabled = false;
            }
        });
    }

    let debounceTimer;

    const closeAutocomplete = () => {
        if (autocompleteDropdown) {
            autocompleteDropdown.innerHTML = '';
            autocompleteDropdown.classList.remove('bem-navbar__autocomplete--active');
        }
    };

    const renderRecentesDropdown = () => {
        const recentes = obterCidadesRecentes();
        if (!recentes.length || !autocompleteDropdown) return;

        autocompleteDropdown.innerHTML = `
            <div style="padding: 0.5rem 0.85rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);">
                🕒 Pesquisas Recentes
            </div>
            ${recentes.map(item => `
                <div class="bem-navbar__autocomplete-item" data-cidade="${item}">
                    <div>
                        <strong>${item}</strong>
                    </div>
                    <span>${SVG_ICONS.search}</span>
                </div>
            `).join('')}
        `;

        autocompleteDropdown.classList.add('bem-navbar__autocomplete--active');

        autocompleteDropdown.querySelectorAll('.bem-navbar__autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const cidadeSel = item.getAttribute('data-cidade');
                salvarCidadeRecente(cidadeSel);
                window.location.hash = `#inicio?cidade=${encodeURIComponent(cidadeSel)}`;
                if (searchInput) searchInput.value = '';
                closeAutocomplete();
            });
        });
    };

    if (searchInput && autocompleteDropdown) {
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                renderRecentesDropdown();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            if (query.length < 2) {
                if (query.length === 0) {
                    renderRecentesDropdown();
                } else {
                    closeAutocomplete();
                }
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const geoData = await buscarServicos(
                        "https://geocoding-api.open-meteo.com/v1/search",
                        { name: query, count: 3, language: "pt", format: "json" },
                        `autocomplete-${query}`
                    );

                    if (geoData && geoData.results && geoData.results.length > 0) {
                        const sugestoes = geoData.results.slice(0, 3);
                        autocompleteDropdown.innerHTML = sugestoes.map(item => {
                            const nomeComp = `${item.name}, ${item.admin1 || item.country_code || 'BR'}`;
                            return `
                                <div class="bem-navbar__autocomplete-item" data-cidade="${nomeComp}">
                                    <div>
                                        <strong>${item.name}</strong>
                                        <div class="bem-navbar__autocomplete-sub">${item.admin1 || ''} • Brasil</div>
                                    </div>
                                    <span>${SVG_ICONS.location}</span>
                                </div>
                            `;
                        }).join('');

                        autocompleteDropdown.classList.add('bem-navbar__autocomplete--active');

                        autocompleteDropdown.querySelectorAll('.bem-navbar__autocomplete-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const cidadeSel = item.getAttribute('data-cidade');
                                salvarCidadeRecente(cidadeSel);
                                window.location.hash = `#inicio?cidade=${encodeURIComponent(cidadeSel)}`;
                                searchInput.value = '';
                                closeAutocomplete();
                            });
                        });
                    } else {
                        closeAutocomplete();
                    }
                } catch (err) {
                    console.error("Erro no autocomplete:", err);
                    closeAutocomplete();
                }
            }, 300);
        });
    }

    document.addEventListener('click', (e) => {
        if (searchForm && !searchForm.contains(e.target)) {
            closeAutocomplete();
        }
    });

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cidade = searchInput.value.trim();
            if (cidade) {
                salvarCidadeRecente(cidade);
                window.location.hash = `#inicio?cidade=${encodeURIComponent(cidade)}`;
                searchInput.value = '';
                closeAutocomplete();
            }
        });
    }
}

export default navbar;
