import buscarServicos from "../services/apiCache.js";

const CAPITAIS_BRASILEIRAS = [
    { nome: "São Paulo", estado: "SP", lat: -23.5505, lon: -46.6333 },
    { nome: "Rio de Janeiro", estado: "RJ", lat: -22.9068, lon: -43.1729 },
    { nome: "Brasília", estado: "DF", lat: -15.7801, lon: -47.9292 },
    { nome: "Salvador", estado: "BA", lat: -12.9714, lon: -38.5014 },
    { nome: "Curitiba", estado: "PR", lat: -25.4284, lon: -49.2733 }
];

function traduzirClimaWmo(codigo) {
    if (codigo === 0) return { texto: "Ensolarado e Limpo", icone: "☀️", frase: "Dia ensolarado com céu limpo." };
    if ([1, 2, 3].includes(codigo)) return { texto: "Parcialmente Nublado", icone: "⛅", frase: "Sol com algumas nuvens." };
    if ([45, 48].includes(codigo)) return { texto: "Nevoeiro", icone: "🌫️", frase: "Nevoeiro com pouca visibilidade." };
    if ([51, 53, 55, 56, 57].includes(codigo)) return { texto: "Garoa Leve", icone: "🌦️", frase: "Possibilidade de chuviscos finos." };
    if ([61, 63, 65, 66, 67].includes(codigo)) return { texto: "Chuva Moderada", icone: "🌧️", frase: "Expectativa de chuva durante o dia." };
    if ([80, 81, 82].includes(codigo)) return { texto: "Pancadas de Chuva", icone: "🌧️", frase: "Expectativa de chuva forte hoje." };
    if ([95, 96, 99].includes(codigo)) return { texto: "Tempestade", icone: "🌩️", frase: "Alerta de tempestade e trovoadas." };
    return { texto: "Nublado", icone: "☁️", frase: "Céu encoberto por nuvens." };
}

function obterDiaSemana(dataIso, indice) {
    if (indice === 0) return "Hoje";
    if (indice === 1) return "Amanhã";
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const d = new Date(dataIso + "T00:00:00");
    return dias[d.getDay()];
}

let mapInstance = null;
let tileLayerInstance = null;

async function inicio(app, queryParams = {}) {
    let cidadeNome = queryParams.cidade || "São Paulo, Brasil";
    let lat = -23.5505;
    let lon = -46.6333;

    if (queryParams.cidade) {
        try {
            const geoData = await buscarServicos(
                "https://geocoding-api.open-meteo.com/v1/search",
                { name: queryParams.cidade, count: 1, language: "pt", format: "json" },
                `geocoding-${queryParams.cidade}`
            );
            if (geoData && geoData.results && geoData.results.length > 0) {
                const local = geoData.results[0];
                cidadeNome = `${local.name}, ${local.admin1 || local.country_code}`;
                lat = local.latitude;
                lon = local.longitude;
            }
        } catch (err) {
            console.error("Erro na geocodificação:", err);
        }
    }

    const locationTextElem = document.getElementById("current-location-text");
    if (locationTextElem) {
        locationTextElem.textContent = cidadeNome;
    }

    let climaData;
    try {
        climaData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m",
                daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
                timezone: "America/Sao_Paulo"
            },
            `clima-${cidadeNome}`
        );
    } catch (e) {
        app.innerHTML = `<div class="cep-container"><div class="cep-card"><h2>Erro ao carregar dados do clima. Verifique a conexão.</h2></div></div>`;
        return;
    }

    const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
    const infoWmo = traduzirClimaWmo(atual.weathercode);
    const tempAtual = Math.round(atual.temperature);
    const ventoSpeed = Math.round(atual.windspeed);
    const umidadeAtual = climaData?.hourly?.relative_humidity_2m?.[0] ?? 50;

    const nascerSol = climaData?.daily?.sunrise?.[0] ? climaData.daily.sunrise[0].split("T")[1] : "06:00";
    const porSol = climaData?.daily?.sunset?.[0] ? climaData.daily.sunset[0].split("T")[1] : "18:30";

    // -------------------------------------------------------------
    // RENDERIZAÇÃO DA INTERFACE (MOBILE MINIMALIST + DESKTOP GRID)
    // -------------------------------------------------------------

    app.innerHTML = `
        <!-- 1. VISUAL MOBILE MINIMALISTA (Inspirado na Referência Mobile) -->
        <div class="mobile-minimalist-view">
            <div class="mobile-location">
                📍 <span>${cidadeNome}</span>
            </div>

            <div class="mobile-hero-icon">
                ${infoWmo.icone}
            </div>

            <div class="mobile-temp-big">
                ${tempAtual}°<span style="font-size: 2rem; font-weight: 500;">C</span>
            </div>

            <div class="mobile-condition-text">
                ${infoWmo.frase}
            </div>

            <div class="mobile-metrics-row">
                <div class="metric-item">
                    💨 <span>${ventoSpeed} km/h</span>
                </div>
                <div class="metric-item">
                    💧 <span>${umidadeAtual}%</span>
                </div>
                <div class="metric-item">
                    ☀️ <span>12h sol</span>
                </div>
            </div>

            <div class="mobile-hourly-section">
                <h3>🕒 Previsão por Hora</h3>
                <div class="hourly-carousel">
                    ${(climaData?.hourly?.time || []).slice(0, 12).map((timeStr, idx) => {
                        const hora = timeStr ? timeStr.split("T")[1]?.substring(0, 5) || "00:00" : "00:00";
                        const tHora = Math.round(climaData?.hourly?.temperature_2m?.[idx] ?? tempAtual);
                        const codeHora = climaData?.hourly?.weather_code?.[idx] ?? 0;
                        const iconeHora = traduzirClimaWmo(codeHora).icone;
                        const isNow = idx === 0;

                        return `
                            <div class="hourly-card ${isNow ? 'hourly-card--active' : ''}">
                                <span class="hourly-card__time">${isNow ? 'Agora' : hora}</span>
                                <span class="hourly-card__icon">${iconeHora}</span>
                                <span class="hourly-card__temp">${tHora}°</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- 2. VISUAL DESKTOP DASHBOARD (Inspirado na Referência Desktop) -->
        <div class="dashboard-grid">
            <div class="dashboard-left">
                <!-- Cabeçalho de Abas -->
                <div class="dashboard-tabs">
                    <div class="dashboard-tabs__list">
                        <button class="dashboard-tabs__btn dashboard-tabs__btn--active" data-aba="hoje">Hoje</button>
                        <button class="dashboard-tabs__btn" data-aba="amanha">Amanhã</button>
                        <button class="dashboard-tabs__btn" data-aba="7dias">Próximos 7 dias</button>
                    </div>
                </div>

                <!-- Grid Semanal de 7 Dias -->
                <div class="forecast-weekly-grid" id="forecast-grid-container">
                    <!-- Hero Card Renderizado via Função -->
                    ${renderHeroCard("hoje", climaData, cidadeNome, infoWmo, tempAtual, ventoSpeed, umidadeAtual, nascerSol, porSol)}

                    <!-- Cards dos Próximos Dias -->
                    ${(climaData?.daily?.time || []).slice(1, 6).map((dataStr, index) => {
                        const idx = index + 1;
                        const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[idx] ?? tempAtual);
                        const tMin = Math.round(climaData?.daily?.temperature_2m_min?.[idx] ?? (tempAtual - 5));
                        const iconeDia = traduzirClimaWmo(climaData?.daily?.weather_code?.[idx] ?? 0).icone;

                        return `
                            <div class="weekly-card">
                                <span class="weekly-card__day">${obterDiaSemana(dataStr, idx)}</span>
                                <span class="weekly-card__icon">${iconeDia}</span>
                                <span class="weekly-card__temp">${tMax}°</span>
                                <span class="weekly-card__temp-sub">${tMin}° min</span>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Card de Mapa Vetorial do Brasil (Leaflet) -->
                <div class="map-card-container">
                    <div class="map-card__header">
                        <h3>🗺️ Condições do Tempo no Brasil</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Monitoramento Vetorial em Tempo Real</span>
                    </div>

                    <div id="mapa-brasil-leaf"></div>
                </div>
            </div>

            <!-- Coluna Direita (Painel Lateral) -->
            <div class="dashboard-right">
                <!-- Painel de Chance de Chuva -->
                <div class="panel-rain">
                    <div class="panel-rain__title">
                        <span>🌧️ Chance de Chuva</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Hoje</span>
                    </div>

                    <div class="rain-chart">
                        ${[
                            { hora: '10 AM', pct: 15 },
                            { hora: '11 AM', pct: 60 },
                            { hora: '12 PM', pct: 85 },
                            { hora: '01 PM', pct: 45 },
                            { hora: '02 PM', pct: 75 },
                            { hora: '03 PM', pct: 30 }
                        ].map(item => `
                            <div class="rain-chart__col">
                                <div class="rain-chart__bar-wrap">
                                    <div class="rain-chart__bar" style="height: ${item.pct}%;"></div>
                                </div>
                                <span class="rain-chart__label">${item.hora}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Painel de Outras Cidades em Destaque (Metrópoles Brasileiras) -->
                <div class="panel-cities">
                    <h3 style="font-family: var(--font-heading); font-size: 1.1rem;">🇧🇷 Principais Capitais</h3>
                    <div class="panel-cities__list">
                        ${CAPITAIS_BRASILEIRAS.map(cap => `
                            <a href="#inicio?cidade=${encodeURIComponent(cap.nome)}" class="city-item">
                                <div class="city-item__info">
                                    <h4>${cap.nome}</h4>
                                    <p>Brasil • ${cap.estado}</p>
                                </div>
                                <div class="city-item__right">
                                    <span class="city-item__icon">☀️</span>
                                    <span class="city-item__temp-val">24°</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event Listeners das Abas
    initTabsEvents(climaData, cidadeNome, infoWmo, tempAtual, ventoSpeed, umidadeAtual, nascerSol, porSol);

    // Inicialização do Mapa Vetorial Leaflet
    initVectorMap();
}

// Renderizador dinâmico do Hero Card conforme a aba selecionada
function renderHeroCard(aba, climaData, cidadeNome, infoWmo, tempAtual, ventoSpeed, umidadeAtual, nascerSol, porSol) {
    if (aba === "amanha") {
        const tMaxAmanha = Math.round(climaData?.daily?.temperature_2m_max?.[1] ?? tempAtual);
        const codeAmanha = climaData?.daily?.weather_code?.[1] ?? 0;
        const infoAmanha = traduzirClimaWmo(codeAmanha);
        const nascerAmanha = climaData?.daily?.sunrise?.[1] ? climaData.daily.sunrise[1].split("T")[1] : "06:01";
        const porAmanha = climaData?.daily?.sunset?.[1] ? climaData.daily.sunset[1].split("T")[1] : "18:31";

        return `
            <div class="weekly-card weekly-card--hero" id="hero-card-dynamic">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <div>
                        <div class="weekly-card__day">Amanhã (Previsão)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${cidadeNome}</div>
                    </div>
                    <div style="font-size: 2.2rem;">${infoAmanha.icone}</div>
                </div>
                <div class="hero-card__temp-big">${tMaxAmanha}°</div>
                
                <div class="hero-card__details-grid">
                    <div>Condição: ${infoAmanha.texto}</div>
                    <div>Vento estimado: ${ventoSpeed + 2} km/h</div>
                    <div>Umidade relativa: ${umidadeAtual}%</div>
                    <div>Pressão: 1014 hPa</div>
                    <div>Sol nascer: ${nascerAmanha}</div>
                    <div>Sol pôr: ${porAmanha}</div>
                </div>
            </div>
        `;
    }

    if (aba === "7dias") {
        return `
            <div class="weekly-card weekly-card--hero" id="hero-card-dynamic">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <div>
                        <div class="weekly-card__day">Visão Geral (7 Dias)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${cidadeNome}</div>
                    </div>
                    <div style="font-size: 2.2rem;">📊</div>
                </div>
                <div class="hero-card__temp-big">${tempAtual}°</div>
                
                <div class="hero-card__details-grid">
                    <div>Sensação: ${tempAtual - 1}°</div>
                    <div>Tendência: Estável</div>
                    <div>Máx Semanal: ${Math.round(climaData?.daily?.temperature_2m_max?.[0] ?? 28)}°</div>
                    <div>Mín Semanal: ${Math.round(climaData?.daily?.temperature_2m_min?.[0] ?? 15)}°</div>
                    <div>Sol nascer: ${nascerSol}</div>
                    <div>Sol pôr: ${porSol}</div>
                </div>
            </div>
        `;
    }

    // Default: "hoje"
    return `
        <div class="weekly-card weekly-card--hero" id="hero-card-dynamic">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <div>
                    <div class="weekly-card__day">Hoje</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${cidadeNome}</div>
                </div>
                <div style="font-size: 2.2rem;">${infoWmo.icone}</div>
            </div>
            <div class="hero-card__temp-big">${tempAtual}°</div>
            
            <div class="hero-card__details-grid">
                <div>Sensação: ${tempAtual - 1}°</div>
                <div>Vento: NE ${ventoSpeed}km/h</div>
                <div>Umidade: ${umidadeAtual}%</div>
                <div>Pressão: 1013 hPa</div>
                <div>Sol nascer: ${nascerSol}</div>
                <div>Sol pôr: ${porSol}</div>
            </div>
        </div>
    `;
}

function initTabsEvents(climaData, cidadeNome, infoWmo, tempAtual, ventoSpeed, umidadeAtual, nascerSol, porSol) {
    const tabBtns = document.querySelectorAll(".dashboard-tabs__btn");
    const heroCardContainer = document.getElementById("hero-card-dynamic");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("dashboard-tabs__btn--active"));
            btn.classList.add("dashboard-tabs__btn--active");

            const abaSelecionada = btn.getAttribute("data-aba");
            if (heroCardContainer) {
                heroCardContainer.outerHTML = renderHeroCard(abaSelecionada, climaData, cidadeNome, infoWmo, tempAtual, ventoSpeed, umidadeAtual, nascerSol, porSol);
            }
        });
    });
}

// Inicialização do Mapa Vetorial Real com Leaflet.js
function initVectorMap() {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    // Destrói instância anterior se existir para evitar vazamento de memória em navegações SPA
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Cria o mapa trancado (pan/zoom desabilitados conforme spec)
    mapInstance = L.map("mapa-brasil-leaf", {
        center: [-14.2350, -51.9253],
        zoom: 4,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false
    });

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    tileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 6,
        minZoom: 3
    }).addTo(mapInstance);

    // Listener para trocar o tileset ao mudar o tema Dark/Light
    window.addEventListener('themeChanged', (e) => {
        if (mapInstance && tileLayerInstance) {
            mapInstance.removeLayer(tileLayerInstance);
            tileLayerInstance = L.tileLayer(getTileUrl(e.detail.theme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                maxZoom: 6,
                minZoom: 3
            }).addTo(mapInstance);
        }
    });

    // Marcadores/Badges geográficos exatos no Brasil
    const capitaisMarcadores = [
        { lat: -23.5505, lon: -46.6333, label: "📍 SP 22° ☀️" },
        { lat: -22.9068, lon: -43.1729, label: "📍 RJ 28° ⛅" },
        { lat: -15.7801, lon: -47.9292, label: "📍 DF 25° ☀️" },
        { lat: -12.9714, lon: -38.5014, label: "📍 BA 30° 🌧️" },
        { lat: -25.4284, lon: -49.2733, label: "📍 PR 18° ⛅" }
    ];

    capitaisMarcadores.forEach(m => {
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge',
            html: `<span>${m.label}</span>`,
            iconSize: [85, 26],
            iconAnchor: [42, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon }).addTo(mapInstance);
    });
}

export default {
    url: "#inicio",
    label: "Dashboard",
    icone: "🌤️",
    pagina: inicio
};
