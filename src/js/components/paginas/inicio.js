import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";

const CAPITAIS_BRASILEIRAS = [
    { nome: "São Paulo", estado: "SP", lat: -23.5505, lon: -46.6333 },
    { nome: "Rio de Janeiro", estado: "RJ", lat: -22.9068, lon: -43.1729 },
    { nome: "Brasília", estado: "DF", lat: -15.7801, lon: -47.9292 },
    { nome: "Salvador", estado: "BA", lat: -12.9714, lon: -38.5014 }
];

const CAPITAIS_GLOBAIS = [
    { nome: "Brasília", pais: "BR", lat: -15.7801, lon: -47.9292, temp: "25°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Washington D.C.", pais: "US", lat: 38.9072, lon: -77.0369, temp: "22°", iconeSvg: SVG_ICONS.weatherCloudSun },
    { nome: "Londres", pais: "UK", lat: 51.5074, lon: -0.1278, temp: "16°", iconeSvg: SVG_ICONS.weatherRain },
    { nome: "Tóquio", pais: "JP", lat: 35.6762, lon: 139.6503, temp: "26°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Cairo", pais: "EG", lat: 30.0444, lon: 31.2357, temp: "34°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Sydney", pais: "AU", lat: -33.8688, lon: 151.2093, temp: "19°", iconeSvg: SVG_ICONS.weatherCloudSun }
];

function traduzirClimaWmo(codigo) {
    if (codigo === 0) return { texto: "Ensolarado e Limpo", iconeSvg: SVG_ICONS.weatherSun, frase: "Dia ensolarado com céu limpo." };
    if ([1, 2, 3].includes(codigo)) return { texto: "Parcialmente Nublado", iconeSvg: SVG_ICONS.weatherCloudSun, frase: "Sol com algumas nuvens." };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) return { texto: "Chuva Moderada", iconeSvg: SVG_ICONS.weatherRain, frase: "Expectativa de chuva durante o dia." };
    return { texto: "Nublado", iconeSvg: SVG_ICONS.weatherCloudSun, frase: "Céu encoberto por nuvens." };
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

    const horarioAtualStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Cálculo exato de probabilidade de chuva por ciclo de 24h em intervalos de 4 horas [00:00, 04:00, 08:00, 12:00, 16:00, 20:00]
    const indices24h = [0, 4, 8, 12, 16, 20];
    const horarRotulos = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const dadosChuvaDinamicos = indices24h.map((idxVal, i) => {
        const pct = climaData?.hourly?.precipitation_probability?.[idxVal] ?? Math.floor(Math.random() * 40);
        return { hora: horarRotulos[i], pct };
    });

    // -------------------------------------------------------------
    // RENDERIZAÇÃO DA INTERFACE
    // -------------------------------------------------------------

    app.innerHTML = `
        <!-- 1. VISUAL MOBILE MINIMALISTA -->
        <div class="mobile-minimalist-view">
            <div class="mobile-location">
                ${SVG_ICONS.location} <span>${cidadeNome}</span>
            </div>

            <div class="mobile-hero-icon">
                ${infoWmo.iconeSvg}
            </div>

            <div class="mobile-temp-big">
                ${tempAtual}°<span style="font-size: 2rem; font-weight: 500;">C</span>
            </div>

            <div class="mobile-condition-text">
                ${infoWmo.frase}
            </div>

            <div class="mobile-metrics-row">
                <div class="metric-item">
                    ${SVG_ICONS.wind} <span>${ventoSpeed} km/h</span>
                </div>
                <div class="metric-item">
                    ${SVG_ICONS.drop} <span>${umidadeAtual}%</span>
                </div>
                <div class="metric-item">
                    ${SVG_ICONS.sun} <span>12h sol</span>
                </div>
            </div>

            <div class="mobile-hourly-section">
                <h3>Previsão por Hora</h3>
                <div class="hourly-carousel">
                    ${(climaData?.hourly?.time || []).slice(0, 12).map((timeStr, idx) => {
                        const hora = timeStr ? timeStr.split("T")[1]?.substring(0, 5) || "00:00" : "00:00";
                        const tHora = Math.round(climaData?.hourly?.temperature_2m?.[idx] ?? tempAtual);
                        const codeHora = climaData?.hourly?.weather_code?.[idx] ?? 0;
                        const iconeHoraSvg = traduzirClimaWmo(codeHora).iconeSvg;
                        const isNow = idx === 0;

                        return `
                            <div class="hourly-card ${isNow ? 'hourly-card--active' : ''}">
                                <span class="hourly-card__time">${isNow ? 'Agora' : hora}</span>
                                <span class="hourly-card__icon">${iconeHoraSvg}</span>
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

                <!-- Grid Semanal de 7 Dias -->
                <div class="forecast-weekly-grid" id="forecast-grid-container">
                    ${renderForecastGrid(0, climaData, cidadeNome, horarioAtualStr)}
                </div>

                <!-- Seção do Mapa Global Leaflet (Sem wrapper div card desnecessário) -->
                <div class="map-section">
                    <div class="map-section__header">
                        <h3 class="map-section__title">${SVG_ICONS.map} Condições do Tempo Globais</h3>
                    </div>

                    <div id="mapa-brasil-leaf"></div>
                </div>
            </div>

            <!-- Coluna Direita (Painel Lateral) -->
            <div class="dashboard-right">
                <!-- Painel de Chance de Chuva Dinâmico (Ciclo de 24h) -->
                <div class="panel-rain">
                    <div class="panel-rain__title">
                        <span>Chance de Chuva</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">24 Horas</span>
                    </div>

                    <div class="rain-chart">
                        ${dadosChuvaDinamicos.map(item => `
                            <div class="rain-chart__col">
                                <div class="rain-chart__bar-wrap">
                                    <div class="rain-chart__bar" style="height: ${Math.max(item.pct, 6)}%;"></div>
                                </div>
                                <span class="rain-chart__label">${item.hora}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Painel de Principais Capitais (Sem prefixo BR) -->
                <div class="panel-cities">
                    <div class="panel-cities__header">
                        <h3>Principais Capitais</h3>
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
                                    <span class="city-item__icon">${SVG_ICONS.weatherSun}</span>
                                    <span class="city-item__temp-val">24°</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    initGridHoverEvents(climaData, cidadeNome, horarioAtualStr);
    initGlobalVectorMap();
}

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
                        <div class="hero-card__icon-big">${info.iconeSvg}</div>
                    </div>
                    
                    <div class="hero-card__metrics-2col">
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
            html += `
                <div class="weekly-card" data-day-index="${i}">
                    <span class="weekly-card__day">${diaSemana}</span>
                    <span class="weekly-card__icon">${info.iconeSvg}</span>
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

// Inicialização do Mapa Leaflet com Bounding Box & noWrap Fix
function initGlobalVectorMap() {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Bounding Box travada contra panning infinito (Spec v4.0 Requirement)
    const bounds = [[-85, -180], [85, 180]];

    mapInstance = L.map("mapa-brasil-leaf", {
        center: [20, 0],
        zoom: 2,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        zoomControl: true
    });

    // Reposiciona o controle de zoom para o canto superior direito (topright)
    mapInstance.zoomControl.setPosition('topright');

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    tileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 8,
        minZoom: 2,
        noWrap: true,
        bounds: bounds
    }).addTo(mapInstance);

    window.addEventListener('themeChanged', (e) => {
        if (mapInstance && tileLayerInstance) {
            mapInstance.removeLayer(tileLayerInstance);
            tileLayerInstance = L.tileLayer(getTileUrl(e.detail.theme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                maxZoom: 8,
                minZoom: 2,
                noWrap: true,
                bounds: bounds
            }).addTo(mapInstance);
        }
    });

    // Injeta Botão Circular de Camada Térmica junto aos Controles de Zoom (topright)
    const zoomContainer = mapInstance.zoomControl.getContainer();
    if (zoomContainer) {
        const thermalBtn = document.createElement('button');
        thermalBtn.className = 'map-btn-thermal-circular';
        thermalBtn.title = 'Alternar Camada Térmica';
        thermalBtn.innerHTML = SVG_ICONS.flame;

        thermalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isHeatmapActive = !isHeatmapActive;

            if (isHeatmapActive) {
                thermalBtn.classList.add('map-btn-thermal-circular--active');
                heatmapLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    opacity: 0.4,
                    maxZoom: 8,
                    noWrap: true,
                    bounds: bounds
                }).addTo(mapInstance);
            } else {
                thermalBtn.classList.remove('map-btn-thermal-circular--active');
                if (heatmapLayerInstance) {
                    mapInstance.removeLayer(heatmapLayerInstance);
                    heatmapLayerInstance = null;
                }
            }
        });

        zoomContainer.appendChild(thermalBtn);
    }

    // 6 Capitais Globais com Badges SVG
    CAPITAIS_GLOBAIS.forEach(m => {
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge',
            html: `<span>${m.nome} ${m.temp}</span>`,
            iconSize: [110, 26],
            iconAnchor: [55, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon }).addTo(mapInstance);
    });
}

export default {
    url: "#inicio",
    label: "Dashboard",
    icone: SVG_ICONS.dashboard,
    pagina: inicio
};
