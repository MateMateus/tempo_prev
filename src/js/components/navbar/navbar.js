import buscarServicos from "../services/apiCache.js";

function navbar(rotas) {
    const header = document.getElementById('navbar');
    if (!header) return;
    
    // Recovery saved theme or default 'dark'
    const savedTheme = localStorage.getItem('tempo_prev_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    header.innerHTML = `
        <nav class="bem-navbar">
            <div class="bem-navbar__container">
                <div class="bem-navbar__left">
                    <button id="btn-toggle-menu" class="bem-navbar__toggle" title="Abrir Menu">
                        ☰
                    </button>
                    <a href="#inicio" class="bem-navbar__brand">
                        <span class="bem-navbar__brand-icon">☀️⛅</span>
                        <span>Tempo Prev</span>
                    </a>
                </div>

                <div class="bem-navbar__center">
                    <form id="form-busca-rapida" class="bem-navbar__search" autocomplete="off">
                        <span class="bem-navbar__search-icon">🔍</span>
                        <input type="text" id="input-busca-rapida" class="bem-navbar__search-input" placeholder="Pesquisar cidade brasileira (ex: São Paulo, Rio, Salvador)..." />
                        <div id="autocomplete-dropdown" class="bem-navbar__autocomplete"></div>
                    </form>
                </div>

                <div class="bem-navbar__right">
                    <button id="btn-toggle-theme" class="bem-navbar__theme-btn" title="Alternar Tema">
                        ${savedTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    
                    <div class="bem-navbar__location-badge" id="navbar-location-badge">
                        📍 <span id="current-location-text">São Paulo, BR</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Off-canvas Menu Drawer -->
        <div id="drawer-overlay" class="bem-drawer__overlay"></div>
        <aside id="drawer-menu" class="bem-drawer">
            <div class="bem-drawer__header">
                <div class="bem-navbar__brand">
                    <span class="bem-navbar__brand-icon">☀️⛅</span>
                    <span>Tempo Prev</span>
                </div>
                <button id="btn-close-drawer" class="bem-drawer__close">&times;</button>
            </div>
            
            <ul class="bem-drawer__menu">
                ${rotas.map(rota => `
                    <li>
                        <a href="${rota.url}" class="bem-drawer__link" data-url="${rota.url}">
                            <span class="bem-drawer__icon">${rota.icone || '📍'}</span>
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

    // Close drawer when link is clicked
    document.querySelectorAll('.bem-drawer__link').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Theme Toggle
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('tempo_prev_theme', newTheme);
            themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            
            // Emit custom event for components like Leaflet Map to update tile theme
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }

    // Autocomplete Search with Debounce (300ms)
    let debounceTimer;

    const closeAutocomplete = () => {
        if (autocompleteDropdown) {
            autocompleteDropdown.innerHTML = '';
            autocompleteDropdown.classList.remove('bem-navbar__autocomplete--active');
        }
    };

    if (searchInput && autocompleteDropdown) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            if (query.length < 2) {
                closeAutocomplete();
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
                                    <span>📍</span>
                                </div>
                            `;
                        }).join('');

                        autocompleteDropdown.classList.add('bem-navbar__autocomplete--active');

                        // Click event for suggestions
                        autocompleteDropdown.querySelectorAll('.bem-navbar__autocomplete-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const cidadeSel = item.getAttribute('data-cidade');
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

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (searchForm && !searchForm.contains(e.target)) {
            closeAutocomplete();
        }
    });

    // Quick Search Form Submit
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cidade = searchInput.value.trim();
            if (cidade) {
                window.location.hash = `#inicio?cidade=${encodeURIComponent(cidade)}`;
                searchInput.value = '';
                closeAutocomplete();
            }
        });
    }
}

export default navbar;
