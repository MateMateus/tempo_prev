function navbar(rotas) {
    const header = document.getElementById('navbar');
    
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
                        <span class="bem-navbar__brand-icon">⚡</span>
                        <span>tempo_prev</span>
                    </a>
                </div>

                <div class="bem-navbar__center">
                    <form id="form-busca-rapida" class="bem-navbar__search">
                        <span class="bem-navbar__search-icon">🔍</span>
                        <input type="text" id="input-busca-rapida" class="bem-navbar__search-input" placeholder="Pesquisar cidade (ex: São Paulo, Rio, Curitiba)..." />
                    </form>
                </div>

                <div class="bem-navbar__right">
                    <button id="btn-toggle-theme" class="bem-navbar__theme-btn" title="Alternar Tema">
                        ${savedTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    
                    <div class="bem-navbar__location-badge" id="navbar-location-badge">
                        📍 <span id="current-location-text">São Paulo, BR</span>
                    </div>

                    <div class="bem-navbar__avatar" title="Perfil do Usuário">
                        M
                    </div>
                </div>
            </div>
        </nav>

        <!-- Off-canvas Menu Drawer -->
        <div id="drawer-overlay" class="bem-drawer__overlay"></div>
        <aside id="drawer-menu" class="bem-drawer">
            <div class="bem-drawer__header">
                <div class="bem-navbar__brand">
                    <span class="bem-navbar__brand-icon">⚡</span>
                    <span>tempo_prev</span>
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

    // Event listeners
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

    const openDrawer = () => {
        drawer.classList.add('bem-drawer--open');
        overlay.classList.add('bem-drawer__overlay--active');
    };

    const closeDrawer = () => {
        drawer.classList.remove('bem-drawer--open');
        overlay.classList.remove('bem-drawer__overlay--active');
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
        });
    }

    // Quick Search Form
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cidade = searchInput.value.trim();
            if (cidade) {
                window.location.hash = `#inicio?cidade=${encodeURIComponent(cidade)}`;
                searchInput.value = '';
            }
        });
    }
}

export default navbar;
