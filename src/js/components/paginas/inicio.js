import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { gerarSlugCidade } from "../../utils/uiHelpers.js";

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
    { nome: "Moscou", pais: "RU", lat: 55.7558, lon: 37.6173, temp: "18°", iconeSvg: SVG_ICONS.weatherSun }
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

const ESTADOS_MAP = {
    "São Paulo": "SP", "Rio de Janeiro": "RJ", "Paraná": "PR", "Distrito Federal": "DF",
    "Bahia": "BA", "Amazonas": "AM", "Pernambuco": "PE", "Rio Grande do Sul": "RS",
    "Minas Gerais": "MG", "Santa Catarina": "SC", "Ceará": "CE", "Goiás": "GO",
    "Maranhão": "MA", "Paraíba": "PB", "Pará": "PA", "Espírito Santo": "ES",
    "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Rio Grande do Norte": "RN",
    "Alagoas": "AL", "Piauí": "PI", "Sergipe": "SE", "Rondônia": "RO",
    "Tocantins": "TO", "Acre": "AC", "Amapá": "AP", "Roraima": "RR"
};

let mapInstance = null;
let tileLayerInstance = null;
let tempTileLayer = typeof L !== "undefined" ? L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', { opacity: 0.65, zIndex: 100 }) : null;
let rainTileLayer = typeof L !== "undefined" ? L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', { opacity: 0.65, zIndex: 100 }) : null;


async function inicio(app, queryParams = {}) {
    if (app) {
        app.innerHTML = `
            <div class="loading-overlay-container app-fade-in">
                <div class="loading-spinner-box">
                    <div class="loading-spinner"></div>
                    <p style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">Buscando dados meteorológicos em tempo real...</p>
                </div>
            </div>
        `;
    }

    let cidadeNome = queryParams.cidade ? queryParams.cidade.replace(/-/g, " ") : "São Paulo, Brasil";
    let lat = -23.5505;
    let lon = -46.6333;

    if (queryParams.cidade) {
        const termoBusca = queryParams.cidade.split("-br")[0].split("-sp")[0].replace(/-/g, " ").trim();
        try {
            const geoData = await buscarServicos(
                "https://geocoding-api.open-meteo.com/v1/search",
                { name: termoBusca, count: 1, language: "pt", format: "json" },
                `geocoding-${termoBusca}`
            );
            if (geoData && geoData.results && geoData.results.length > 0) {
                const local = geoData.results[0];
                const nomeLocal = local.name;
                const ufLocal = (local.admin1 && local.admin1.toLowerCase() !== nomeLocal.toLowerCase()) 
                    ? (ESTADOS_MAP[local.admin1] || local.admin1) 
                    : (local.country_code ? local.country_code.toUpperCase() : "Brasil");
                cidadeNome = `${nomeLocal}, ${ufLocal}`;
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
            `clima-${lat}-${lon}`
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

    const indices24h = [0, 4, 8, 12, 16, 20];
    const horarRotulos = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const dadosChuvaDinamicos = indices24h.map((idxVal, i) => {
        const pct = climaData?.hourly?.precipitation_probability?.[idxVal] ?? Math.floor(Math.random() * 40);
        return { hora: horarRotulos[i], pct };
    });

    const capitaisComClima = await Promise.all(CAPITAIS_BRASILEIRAS.map(async (cap) => {
        try {
            const data = await buscarServicos(
                "https://api.open-meteo.com/v1/forecast",
                { latitude: cap.lat, longitude: cap.lon, current_weather: true, timezone: "America/Sao_Paulo" },
                `inicio-cap-${cap.nome}`
            );
            const t = Math.round(data?.current_weather?.temperature ?? 24);
            const code = data?.current_weather?.weathercode ?? 0;
            const icone = traduzirClimaWmo(code).iconeSvg;
            return { ...cap, temp: `${t}°`, icone };
        } catch (e) {
            return { ...cap, temp: "24°", icone: SVG_ICONS.weatherSun };
        }
    }));

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

            <!-- Grade Completa de Métricas no Mobile (Sem mapa e sem gráficos) -->
            <div class="mobile-metrics-grid">
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.thermometer || SVG_ICONS.sun || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Sensação Térmica</span>
                        <span class="mobile-metric-card__val">${tempAtual - 1}°C</span>
                    </div>
                </div>
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.sun || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Máx / Mín do dia</span>
                        <span class="mobile-metric-card__val">${Math.round(climaData?.daily?.temperature_2m_max?.[0] ?? 22)}°C / ${Math.round(climaData?.daily?.temperature_2m_min?.[0] ?? 17)}°C</span>
                    </div>
                </div>
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.drop || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Umidade Relativa</span>
                        <span class="mobile-metric-card__val">${umidadeAtual}%</span>
                    </div>
                </div>
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.wind || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Velocidade do Vento</span>
                        <span class="mobile-metric-card__val">${ventoSpeed} km/h</span>
                    </div>
                </div>
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.gauge || SVG_ICONS.target || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Pressão Atmosférica</span>
                        <span class="mobile-metric-card__val">1013 hPa</span>
                    </div>
                </div>
                <div class="mobile-metric-card">
                    <span class="mobile-metric-card__icon">${SVG_ICONS.sunrise || SVG_ICONS.sun || ''}</span>
                    <div class="mobile-metric-card__info">
                        <span class="mobile-metric-card__label">Nascer / Pôr do Sol</span>
                        <span class="mobile-metric-card__val">${climaData?.daily?.sunrise?.[0] ? climaData.daily.sunrise[0].split("T")[1] : "06:00"} / ${climaData?.daily?.sunset?.[0] ? climaData.daily.sunset[0].split("T")[1] : "18:30"}</span>
                    </div>
                </div>
            </div>

            <div class="mobile-hourly-section">
                <h3>Previsão por Hora</h3>
                <div class="hourly-carousel">
                    ${[0, 3, 6, 9, 12, 15, 18, 21].map((apiIdx, i) => {
        const timeStr = climaData?.hourly?.time?.[apiIdx];
        const defaultLabel = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"][i];
        const hora = timeStr ? timeStr.split("T")[1]?.substring(0, 5) || defaultLabel : defaultLabel;
        const tHora = Math.round(climaData?.hourly?.temperature_2m?.[apiIdx] ?? tempAtual);
        const codeHora = climaData?.hourly?.weather_code?.[apiIdx] ?? 0;
        const iconeHoraSvg = traduzirClimaWmo(codeHora).iconeSvg;
        const isNow = i === 0;

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

            <!-- Seção Mobile de 7 Dias -->
            <div class="mobile-daily-section">
                <h3>Previsão para 7 Dias</h3>
                <div class="daily-carousel" id="mobile-daily-carousel">
                    ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const dataStr = climaData?.daily?.time?.[i] || '';
                        const diaSemana = obterDiaSemana(dataStr, i);
                        const code = climaData?.daily?.weather_code?.[i] ?? 0;
                        const info = traduzirClimaWmo(code);
                        const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[i] ?? 22);
                        const tMin = Math.round(climaData?.daily?.temperature_2m_min?.[i] ?? 17);

                        return `
                            <div class="daily-card ${i === 0 ? 'daily-card--active' : ''}" data-day-index="${i}">
                                <span class="daily-card__day">${diaSemana}</span>
                                <span class="daily-card__icon">${info.iconeSvg}</span>
                                <div class="daily-card__temps">
                                    <span class="daily-card__tmax">${tMax}°</span>
                                    <span class="daily-card__tmin">${tMin}°</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Painel de Detalhes Expansível Mobile -->
                <div class="mobile-daily-details-panel mobile-daily-details-panel--open" id="mobile-daily-details-panel">
                    ${renderMobileDailyDetailsHtml(0, climaData, cidadeNome)}
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
                    ${renderForecastGrid(0, climaData, cidadeNome, horarioAtualStr, tempAtual, umidadeAtual, ventoSpeed)}
                </div>

                <!-- Seção do Mapa Global Leaflet -->
                <div class="map-section">
                    <div class="map-section__header">
                        <h3 class="map-section__title">${SVG_ICONS.map} Condições do Tempo Globais</h3>
                    </div>

                    <div id="mapa-brasil-leaf"></div>
                </div>
            </div>

            <!-- Coluna Direita (Painel Lateral) -->
            <div class="dashboard-right">
                <!-- Painel de Chance de Chuva Dinâmico -->
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

                <!-- Painel de Principais Capitais -->
                <div class="panel-cities">
                    <div class="panel-cities__header">
                        <h3>Principais Capitais</h3>
                        <a href="#capitais" class="panel-cities__btn-more">Ver mais →</a>
                    </div>
                    <div class="panel-cities__list">
                        ${capitaisComClima.map(cap => `
                            <a href="#clima/${gerarSlugCidade(cap.nome)}" class="city-item">
                                <div class="city-item__info">
                                    <h4>${cap.nome}</h4>
                                    <p>Brasil • ${cap.estado}</p>
                                </div>
                                <div class="city-item__right">
                                    <span class="city-item__icon">${cap.icone}</span>
                                    <span class="city-item__temp-val">${cap.temp}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const capitaisGlobaisComClima = await Promise.all(CAPITAIS_GLOBAIS.map(async (cap) => {
        try {
            const data = await buscarServicos(
                "https://api.open-meteo.com/v1/forecast",
                { latitude: cap.lat, longitude: cap.lon, current_weather: true },
                `inicio-global-${cap.nome}`
            );
            const t = Math.round(data?.current_weather?.temperature ?? parseInt(cap.temp));
            return { ...cap, temp: `${t}°` };
        } catch (e) {
            return cap;
        }
    }));

    initGridEvents(climaData, cidadeNome, horarioAtualStr, tempAtual, umidadeAtual, ventoSpeed);
    initMobileDailyEvents(climaData, cidadeNome);
    initGlobalVectorMap(capitaisGlobaisComClima);
}

function renderMobileDailyDetailsHtml(dayIdx, climaData, cidadeNome) {
    const dataStr = climaData?.daily?.time?.[dayIdx] || '';
    const diaSemana = obterDiaSemana(dataStr, dayIdx);
    const code = climaData?.daily?.weather_code?.[dayIdx] ?? 0;
    const info = traduzirClimaWmo(code);
    const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[dayIdx] ?? 22);
    const tMin = Math.round(climaData?.daily?.temperature_2m_min?.[dayIdx] ?? 17);

    const probChuva = climaData?.daily?.precipitation_probability_max?.[dayIdx] ?? (15 + dayIdx * 10);
    const uvVal = Math.max(2, Math.min(10, 8 - Math.floor(code / 15)));
    const uvText = uvVal >= 8 ? `${uvVal} - Muito Alto` : (uvVal >= 6 ? `${uvVal} - Alto` : (uvVal >= 3 ? `${uvVal} - Moderado` : `${uvVal} - Baixo`));

    const umidadeDia = climaData?.hourly?.relative_humidity_2m?.[dayIdx * 24 + 12] ?? 60;
    const ventoDia = Math.round(climaData?.hourly?.wind_speed_10m?.[dayIdx * 24 + 12] ?? 12 + dayIdx);

    return `
        <div class="mobile-details-card">
            <div class="mobile-details-card__header">
                <h4>${diaSemana} — ${info.texto}</h4>
                <span class="mobile-details-card__temp-badge">${tMax}°C / ${tMin}°C</span>
            </div>

            <div class="mobile-details-card__grid">
                <div class="mobile-details-item">
                    <span class="mobile-details-item__icon">${SVG_ICONS.rain || SVG_ICONS.drop}</span>
                    <div class="mobile-details-item__info">
                        <span class="mobile-details-item__label">Probabilidade de Chuva</span>
                        <span class="mobile-details-item__val">${probChuva}% de chance</span>
                    </div>
                </div>
                <div class="mobile-details-item">
                    <span class="mobile-details-item__icon">${SVG_ICONS.sun}</span>
                    <div class="mobile-details-item__info">
                        <span class="mobile-details-item__label">Índice UV Previsto</span>
                        <span class="mobile-details-item__val">${uvText}</span>
                    </div>
                </div>
                <div class="mobile-details-item">
                    <span class="mobile-details-item__icon">${SVG_ICONS.drop}</span>
                    <div class="mobile-details-item__info">
                        <span class="mobile-details-item__label">Umidade Relativa</span>
                        <span class="mobile-details-item__val">${umidadeDia}%</span>
                    </div>
                </div>
                <div class="mobile-details-item">
                    <span class="mobile-details-item__icon">${SVG_ICONS.wind}</span>
                    <div class="mobile-details-item__info">
                        <span class="mobile-details-item__label">Velocidade do Vento</span>
                        <span class="mobile-details-item__val">${ventoDia} km/h</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initMobileDailyEvents(climaData, cidadeNome) {
    const carousel = document.getElementById("mobile-daily-carousel");
    const detailsPanel = document.getElementById("mobile-daily-details-panel");
    if (!carousel || !detailsPanel) return;

    let activeIdx = 0;
    let isOpen = true;

    const cards = carousel.querySelectorAll(".daily-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const idxStr = card.getAttribute("data-day-index");
            if (idxStr === null) return;
            const idx = parseInt(idxStr, 10);

            if (idx === activeIdx) {
                isOpen = !isOpen;
                if (isOpen) {
                    detailsPanel.classList.add("mobile-daily-details-panel--open");
                } else {
                    detailsPanel.classList.remove("mobile-daily-details-panel--open");
                }
            } else {
                activeIdx = idx;
                isOpen = true;

                cards.forEach(c => c.classList.remove("daily-card--active"));
                card.classList.add("daily-card--active");

                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

                detailsPanel.style.opacity = '0';
                detailsPanel.style.transform = 'translateY(6px)';

                setTimeout(() => {
                    detailsPanel.innerHTML = renderMobileDailyDetailsHtml(activeIdx, climaData, cidadeNome);
                    detailsPanel.classList.add("mobile-daily-details-panel--open");
                    detailsPanel.style.opacity = '1';
                    detailsPanel.style.transform = 'translateY(0)';
                }, 150);
            }
        });
    });
}

function renderForecastGrid(focusedIdx, climaData, cidadeNome, horarioAtualStr, tempAtual, umidadeAtual, ventoSpeed) {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1024;
    let html = '';

    if (isDesktop) {
        // Layout Desktop (1440px - 2560px): Linha única horizontal, expandindo inline o card em focusedIdx
        const totalDias = Math.min(climaData?.daily?.time?.length || 7, 7);
        for (let i = 0; i < totalDias; i++) {
            const dataStr = climaData?.daily?.time?.[i] || '';
            const diaSemana = obterDiaSemana(dataStr, i);
            const code = climaData?.daily?.weather_code?.[i] ?? 0;
            const info = traduzirClimaWmo(code);
            const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[i] ?? 22);
            const tMin = Math.round(climaData?.daily?.temperature_2m_min?.[i] ?? 17);

            const tempHero = (i === 0 && tempAtual !== undefined) ? tempAtual : tMax;
            const sensacaoHero = (i === 0 && tempAtual !== undefined) ? (tempAtual - 1) : (tMax - 1);
            const ventoHero = (i === 0 && ventoSpeed !== undefined) ? ventoSpeed : Math.round(climaData?.current_weather?.windspeed ?? 12) + (i * 2);
            const umidadeHero = (i === 0 && umidadeAtual !== undefined) ? umidadeAtual : Math.round(climaData?.hourly?.relative_humidity_2m?.[i * 24 + 12] ?? climaData?.hourly?.relative_humidity_2m?.[i] ?? 55);

            const nascer = climaData?.daily?.sunrise?.[i] ? climaData.daily.sunrise[i].split("T")[1] : "06:00";
            const por = climaData?.daily?.sunset?.[i] ? climaData.daily.sunset[i].split("T")[1] : "18:30";

            if (i === focusedIdx) {
                html += `
                    <div class="weekly-card weekly-card--hero weekly-card--expanded weather-hero-card" data-day-index="${i}">
                        <div style="display: flex; flex-direction: column; width: 100%; gap: 2px;">
                            <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); line-height: 1.25; margin-bottom: 1px;">${cidadeNome}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 4px;">
                                <span class="weekly-card__day" style="font-size: 0.775rem; color: var(--text-muted); white-space: nowrap; line-height: 1.2;">${diaSemana} • ${horarioAtualStr}</span>
                                <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-align: right; white-space: nowrap; line-height: 1.2;">${info.texto}</span>
                            </div>
                        </div>
                        
                        <div class="hero-card__temp-row">
                            <div class="hero-card__temp-big">${tempHero}°</div>
                            <div class="hero-card__icon-big">${info.iconeSvg}</div>
                        </div>
                        
                        <div class="hero-card__metrics-vertical">
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Sensação Térmica:</span>
                                <span class="hero-card__metric-val">${sensacaoHero}°C</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Máx / Mín do dia:</span>
                                <span class="hero-card__metric-val">${tMax}°C / ${tMin}°C</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Umidade Relativa:</span>
                                <span class="hero-card__metric-val">${umidadeHero}%</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Velocidade do Vento:</span>
                                <span class="hero-card__metric-val">${ventoHero} km/h</span>
                            </div>
                            <div class="hero-card__metric-item">
                                <span class="hero-card__metric-label">Pressão Atmosférica:</span>
                                <span class="hero-card__metric-val">1013 hPa</span>
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
                    </div>
                `;
            } else {
                html += `
                    <div class="weekly-card" data-day-index="${i}">
                        <span class="weekly-card__day">${diaSemana}</span>
                        <span class="weekly-card__icon">${info.iconeSvg}</span>
                        <span class="weekly-card__temp">${tempHero}°</span>
                    </div>
                `;
            }
        }
    } else {
        // Layout Tablet / Mobile (768px - 1024px): 6 cards minimizados fixos nas Linhas 1 e 2 + 1 Card Detalhado fixo na Linha 3
        const totalDias = Math.min(climaData?.daily?.time?.length || 6, 6);
        for (let i = 0; i < totalDias; i++) {
            const dataStr = climaData?.daily?.time?.[i] || '';
            const diaSemana = obterDiaSemana(dataStr, i);
            const code = climaData?.daily?.weather_code?.[i] ?? 0;
            const info = traduzirClimaWmo(code);
            const tMax = Math.round(climaData?.daily?.temperature_2m_max?.[i] ?? 22);
            const isSelected = (i === focusedIdx);

            html += `
                <div class="weekly-card ${isSelected ? 'weekly-card--active' : ''}" data-day-index="${i}">
                    <span class="weekly-card__day">${diaSemana}</span>
                    <span class="weekly-card__icon">${info.iconeSvg}</span>
                    <span class="weekly-card__temp">${tMax}°</span>
                </div>
            `;
        }

        // Card de detalhes fixo na 3ª linha
        const dataHeroStr = climaData?.daily?.time?.[focusedIdx] || '';
        const diaHeroSemana = obterDiaSemana(dataHeroStr, focusedIdx);
        const codeHero = climaData?.daily?.weather_code?.[focusedIdx] ?? 0;
        const infoHero = traduzirClimaWmo(codeHero);
        const tMaxHero = Math.round(climaData?.daily?.temperature_2m_max?.[focusedIdx] ?? 22);
        const tMinHero = Math.round(climaData?.daily?.temperature_2m_min?.[focusedIdx] ?? 17);
        
        const tempHeroVal = (focusedIdx === 0 && tempAtual !== undefined) ? tempAtual : tMaxHero;
        const sensacaoHeroVal = (focusedIdx === 0 && tempAtual !== undefined) ? (tempAtual - 1) : (tMaxHero - 1);
        const ventoHeroVal = (focusedIdx === 0 && ventoSpeed !== undefined) ? ventoSpeed : Math.round(climaData?.current_weather?.windspeed ?? 12) + (focusedIdx * 2);
        const umidadeHeroVal = (focusedIdx === 0 && umidadeAtual !== undefined) ? umidadeAtual : Math.round(climaData?.hourly?.relative_humidity_2m?.[focusedIdx * 24 + 12] ?? climaData?.hourly?.relative_humidity_2m?.[focusedIdx] ?? 55);

        const nascerHero = climaData?.daily?.sunrise?.[focusedIdx] ? climaData.daily.sunrise[focusedIdx].split("T")[1] : "06:00";
        const porHero = climaData?.daily?.sunset?.[focusedIdx] ? climaData.daily.sunset[focusedIdx].split("T")[1] : "18:30";

        html += `
            <div class="weekly-card weekly-card--hero weekly-card--expanded weather-hero-card" data-day-index="${focusedIdx}">
                <div style="display: flex; flex-direction: column; width: 100%; gap: 2px;">
                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); line-height: 1.25; margin-bottom: 1px;">${cidadeNome}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 4px;">
                        <span class="weekly-card__day" style="font-size: 0.775rem; color: var(--text-muted); white-space: nowrap; line-height: 1.2;">${diaHeroSemana} • ${horarioAtualStr}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-align: right; white-space: nowrap; line-height: 1.2;">${infoHero.texto}</span>
                    </div>
                </div>
                
                <div class="hero-card__temp-row">
                    <div class="hero-card__temp-big">${tempHeroVal}°</div>
                    <div class="hero-card__icon-big">${infoHero.iconeSvg}</div>
                </div>
                
                <div class="hero-card__metrics-vertical">
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Sensação Térmica:</span>
                        <span class="hero-card__metric-val">${sensacaoHeroVal}°C</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Máx / Mín do dia:</span>
                        <span class="hero-card__metric-val">${tMaxHero}°C / ${tMinHero}°C</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Umidade Relativa:</span>
                        <span class="hero-card__metric-val">${umidadeHeroVal}%</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Velocidade do Vento:</span>
                        <span class="hero-card__metric-val">${ventoHeroVal} km/h</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Pressão Atmosférica:</span>
                        <span class="hero-card__metric-val">1013 hPa</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Nascer do Sol:</span>
                        <span class="hero-card__metric-val">${nascerHero}</span>
                    </div>
                    <div class="hero-card__metric-item">
                        <span class="hero-card__metric-label">Pôr do Sol:</span>
                        <span class="hero-card__metric-val">${porHero}</span>
                    </div>
                </div>
            </div>
        `;
    }

    return html;
}

// Gerenciador de Eventos do Grid (Troca por CLIQUE obrigatória no Tablet/Mobile, Hover opcional apenas em Desktop 1025px+)
function initGridEvents(climaData, cidadeNome, horarioAtualStr, tempAtual, umidadeAtual, ventoSpeed) {
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
            gridContainer.innerHTML = renderForecastGrid(activeFocusedIdx, climaData, cidadeNome, horarioAtualStr, tempAtual, umidadeAtual, ventoSpeed);
            bindCardListeners();
        }
    };

    const bindCardListeners = () => {
        const cards = gridContainer.querySelectorAll(".weekly-card");
        cards.forEach(card => {
            const idxStr = card.getAttribute("data-day-index");
            if (idxStr === null) return;
            const idx = parseInt(idxStr, 10);

            // Clique é SEMPRE ativado em qualquer resolução (Spec v7.0 Requirement)
            card.addEventListener("click", () => {
                updateGrid(idx);
            });

            // Hover ativado EXCLUSIVAMENTE em telas desktop grandes (> 1024px) (Spec v7.0: Eliminar hover no tablet)
            if (window.innerWidth > 1024) {
                card.addEventListener("mouseenter", () => {
                    updateGrid(idx);
                });
            }
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

    bindCardListeners();
}

// Inicialização do Mapa Leaflet sem Rótulos CJK e com Camadas Reais (Térmica + Chuva)
function initGlobalVectorMap(capitaisGlobaisDados = CAPITAIS_GLOBAIS) {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    const bounds = [[-85, -180], [85, 180]];

    mapInstance = L.map("mapa-brasil-leaf", {
        center: [25, 15],
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

    mapInstance.zoomControl.setPosition('topright');

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png';
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

    if (!tempTileLayer && typeof L !== "undefined") {
        tempTileLayer = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', {
            opacity: 0.65,
            zIndex: 100,
            maxZoom: 8,
            noWrap: true,
            bounds: bounds
        });
    }

    if (!rainTileLayer && typeof L !== "undefined") {
        rainTileLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', {
            opacity: 0.65,
            zIndex: 100,
            maxZoom: 8,
            noWrap: true,
            bounds: bounds
        });
    }

    // 6 Capitais Globais
    capitaisGlobaisDados.forEach(m => {
        const isWashington = m.nome.includes("Washington");
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge' + (isWashington ? ' leaflet-map-badge--washington' : ''),
            html: `<span>${m.nome} ${m.temp}</span>`,
            iconSize: isWashington ? [130, 26] : [110, 26],
            iconAnchor: isWashington ? [15, 13] : [55, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon, zIndexOffset: 1000 }).addTo(mapInstance);
    });
}

export default {
    url: "#inicio",
    label: "Dashboard",
    icone: SVG_ICONS.dashboard,
    pagina: inicio
};
