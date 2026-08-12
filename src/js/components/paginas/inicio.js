import buscarServicos from "../services/apiCache.js";

const CAPITAIS_BRASILEIRAS = [
    { nome: "São Paulo", estado: "SP", lat: -23.5505, lon: -46.6333 },
    { nome: "Rio de Janeiro", estado: "RJ", lat: -22.9068, lon: -43.1729 },
    { nome: "Brasília", estado: "DF", lat: -15.7801, lon: -47.9292 },
    { nome: "Salvador", estado: "BA", lat: -12.9714, lon: -38.5014 }
];

const CAPITAIS_GLOBAIS = [
    { nome: "Brasília", pais: "BR", lat: -15.7801, lon: -47.9292, temp: "25°", icone: "☀️" },
    { nome: "Washington D.C.", pais: "US", lat: 38.9072, lon: -77.0369, temp: "22°", icone: "⛅" },
    { nome: "Londres", pais: "UK", lat: 51.5074, lon: -0.1278, temp: "16°", icone: "🌧️" },
    { nome: "Tóquio", pais: "JP", lat: 35.6762, lon: 139.6503, temp: "26°", icone: "☀️" },
    { nome: "Cairo", pais: "EG", lat: 30.0444, lon: 31.2357, temp: "34°", icone: "☀️" },
    { nome: "Sydney", pais: "AU", lat: -33.8688, lon: 151.2093, temp: "19°", icone: "⛅" }
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
let heatmapLayerInstance = null;
let isHeatmapActive = false;

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

    // Horário dinâmico em tempo real
    const horarioAtualStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Preparar dados dinâmicos de probabilidade de chuva (próximas 6 horas)
    const dadosChuvaDinamicos = (climaData?.hourly?.time || []).slice(0, 6).map((timeStr, idx) => {
        const hora = timeStr ? timeStr.split("T")[1]?.substring(0, 5) : `${10 + idx}:00`;
        const pct = climaData?.hourly?.precipitation_probability?.[idx] ?? Math.floor(Math.random() * 60);
        return { hora, pct };
    });

    // -------------------------------------------------------------
    // RENDERIZAÇÃO DA INTERFACE (DESKTOP GRID + MOBILE MINIMALIST)
    // -------------------------------------------------------------

    app.innerHTML = `
        <!-- 1. VISUAL MOBILE MINIMALISTA -->
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

        <!-- 2. VISUAL DESKTOP DASHBOARD -->
        <div class="dashboard-grid">
            <div class="dashboard-left">
                <!-- Cabeçalho de Abas -->
                <div class="dashboard-tabs">
                    <div class="dashboard-tabs__list">
                        <button class="dashboard-tabs__btn dashboard-tabs__btn--active" data-day-index="0">Hoje</button>
                        <button class="dashboard-tabs__btn" data-day-index="1">Amanhã</button>
                        <button class="dashboard-tabs__btn" data-day-index="7dias">Próximos 7 dias</button>
                    </div>
                </div>

                <!-- Grid Semanal de 7 Dias com Hover Expansivo -->
                <div class="forecast-weekly-grid" id="forecast-grid-container">
                    ${renderForecastGrid(0, climaData, cidadeNome, horarioAtualStr)}
                </div>

                <!-- Card de Mapa Global Interativo (Leaflet) -->
                <div class="map-card-container">
                    <div class="map-card__header">
                        <h3>🗺️ Condições do Tempo Globais</h3>
                        <button id="btn-toggle-heatmap" class="map-card__btn-layer">🔥 Camada Térmica</button>
                    </div>

                    <div id="mapa-brasil-leaf"></div>
                </div>
            </div>

            <!-- Coluna Direita (Painel Lateral) -->
            <div class="dashboard-right">
                <!-- Painel de Chance de Chuva Dinâmico -->
                <div class="panel-rain">
                    <div class="panel-rain__title">
                        <span>🌧️ Chance de Chuva</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Próximas Horas</span>
                    </div>

                    <div class="rain-chart">
                        ${dadosChuvaDinamicos.map(item => `
                            <div class="rain-chart__col">
                                <div class="rain-chart__bar-wrap">
                                    <div class="rain-chart__bar" style="height: ${Math.max(item.pct, 8)}%;"></div>
                                </div>
                                <span class="rain-chart__label">${item.hora}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Painel de Principais Capitais com Botão Ver Mais -->
                <div class="panel-cities">
                    <div class="panel-cities__header">
                        <h3>🇧🇷 Principais Capitais</h3>
                        <a href="#capitais" class="panel-cities__btn-more">Ver mais →</a>
                    </div>
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

    // Event Listeners das Abas e do Hover nos Cards Diários
    initGridHoverEvents(climaData, cidadeNome, horarioAtualStr);

    // Inicialização do Mapa Global Leaflet
    initGlobalVectorMap();
}

// Renderizador da Grid Semanal (Hero + Cards Compactos)
function renderForecastGrid(focusedIdx, climaData, cidadeNome, horarioAtualStr) {
    const totalDias = Math.min(climaData?.daily?.time?.length || 7, 7);
    let html = '';

    for (let i = 0; i < totalDias; i++) {
        const dataStr = climaData?.daily?.time?.[i] || '';
        const diaSemana = obterDiaSemana(dataStr, i);
        const code = climaData?.daily?.weather_code?.[i] ?? 0;
        const info = traduzirClimaWmo(code);
        const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[i] ?? 22);
        const vento = Math.round(climaData?.current_weather?.windspeed ?? 12) + (i * 2);
        const umidade = Math.round(climaData?.hourly?.relative_humidity_2m?.[i] ?? 55);
        const nascer = climaData?.daily?.sunrise?.[i] ? climaData.daily.sunrise[i].split("T")[1] : "06:00";
        const por = climaData?.daily?.sunset?.[i] ? climaData.daily.sunset[i].split("T")[1] : "18:30";

        if (i === focusedIdx) {
            // CARD HERO EXPANDIDO
            html += `
                <div class="weekly-card weekly-card--hero" data-day-index="${i}">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <div>
                            <div class="weekly-card__day">${diaSemana} • ${horarioAtualStr}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${cidadeNome}</div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${info.texto}</div>
                    </div>
                    
                    <div class="hero-card__temp-row">
                        <div class="hero-card__temp-big">${tMax}°</div>
                        <div class="hero-card__icon-big">${info.icone}</div>
                    </div>
                    
                    <div class="hero-card__metrics-2col">
                        <!-- Coluna Esquerda: 4 Métricas -->
                        <div class="hero-card__metric-col">
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Sensação:</span>
                                <span class="hero-card__metric-val">${tMax - 1}°C</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Umidade:</span>
                                <span class="hero-card__metric-val">${umidade}%</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Nascer do Sol:</span>
                                <span class="hero-card__metric-val">${nascer}</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Pôr do Sol:</span>
                                <span class="hero-card__metric-val">${por}</span>
                            </div>
                        </div>

                        <!-- Coluna Direita: 2 Métricas -->
                        <div class="hero-card__metric-col">
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Vento:</span>
                                <span class="hero-card__metric-val">${vento} km/h</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Pressão:</span>
                                <span class="hero-card__metric-val">1013 hPa</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // CARD COMPACTO (Sem rótulo de mínimas)
            html += `
                <div class="weekly-card" data-day-index="${i}">
                    <span class="weekly-card__day">${diaSemana}</span>
                    <span class="weekly-card__icon">${info.icone}</span>
                    <span class="weekly-card__temp">${tMax}°</span>
                </div>
            `;
        }
    }

    return html;
}

function initGridHoverEvents(climaData, cidadeNome, horarioAtualStr) {
    const gridContainer = document.getElementById("forecast-grid-container");
    const tabBtns = document.querySelectorAll(".dashboard-tabs__btn");
    let activeFocusedIdx = 0;

    const updateGrid = (newIdx) => {
        if (newIdx === activeFocusedIdx) return;
        activeFocusedIdx = newIdx;

        // Atualiza estilo das abas
        tabBtns.forEach(btn => {
            const btnVal = btn.getAttribute("data-day-index");
            if ((btnVal === "0" && activeFocusedIdx === 0) || (btnVal === "1" && activeFocusedIdx === 1) || (btnVal === "7dias" && activeFocusedIdx > 1)) {
                btn.classList.add("dashboard-tabs__btn--active");
            } else {
                btn.classList.remove("dashboard-tabs__btn--active");
            }
        });

        if (gridContainer) {
            gridContainer.innerHTML = renderForecastGrid(activeFocusedIdx, climaData, cidadeNome, horarioAtualStr);
            bindHoverListeners();
        }
    };

    const bindHoverListeners = () => {
        const cards = gridContainer.querySelectorAll(".weekly-card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                const idxStr = card.getAttribute("data-day-index");
                if (idxStr !== null) {
                    const idx = parseInt(idxStr, 10);
                    updateGrid(idx);
                }
            });
        });
    };

    // Listeners nas Abas
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-day-index");
            if (val === "0") updateGrid(0);
            else if (val === "1") updateGrid(1);
            else if (val === "7dias") updateGrid(2);
        });
    });

    bindHoverListeners();
}

// Inicialização do Mapa Global Leaflet com Zoom/Drag Habilitados e Heatmap Layer
function initGlobalVectorMap() {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Mapa Global Interativo (Visão do Mundo: setView([20, 0], 2))
    mapInstance = L.map("mapa-brasil-leaf", {
        center: [20, 0],
        zoom: 2,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        zoomControl: true
    });

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    tileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 8,
        minZoom: 2
    }).addTo(mapInstance);

    // Sync theme on toggle
    window.addEventListener('themeChanged', (e) => {
        if (mapInstance && tileLayerInstance) {
            mapInstance.removeLayer(tileLayerInstance);
            tileLayerInstance = L.tileLayer(getTileUrl(e.detail.theme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                maxZoom: 8,
                minZoom: 2
            }).addTo(mapInstance);
        }
    });

    // 6 Capitais Globais bem espaçadas
    CAPITAIS_GLOBAIS.forEach(m => {
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge',
            html: `<span>📍 ${m.nome} ${m.temp} ${m.icone}</span>`,
            iconSize: [110, 26],
            iconAnchor: [55, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon }).addTo(mapInstance);
    });

    // Botão Alternador de Camada Térmica (Heatmap Global)
    const btnHeatmap = document.getElementById("btn-toggle-heatmap");
    if (btnHeatmap) {
        btnHeatmap.addEventListener("click", () => {
            isHeatmapActive = !isHeatmapActive;

            if (isHeatmapActive) {
                btnHeatmap.classList.add("map-card__btn-layer--active");
                btnHeatmap.textContent = "🔥 Camada Térmica Ativa";

                // Adiciona Tile Layer Térmico com opacidade suave (0.45)
                heatmapLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    opacity: 0.45,
                    maxZoom: 8
                }).addTo(mapInstance);
            } else {
                btnHeatmap.classList.remove("map-card__btn-layer--active");
                btnHeatmap.textContent = "🔥 Camada Térmica";

                if (heatmapLayerInstance) {
                    mapInstance.removeLayer(heatmapLayerInstance);
                    heatmapLayerInstance = null;
                }
            }
        });
    }
}

export default {
    url: "#inicio",
    label: "Dashboard",
    icone: "🌤️",
    pagina: inicio
};
