import buscarServicos from "../services/apiCache.js";

// Capitais brasileiras para o painel "Outras Cidades"
const CAPITAIS_BRASILEIRAS = [
    { nome: "São Paulo", estado: "SP", lat: -23.5505, lon: -46.6333 },
    { nome: "Rio de Janeiro", estado: "RJ", lat: -22.9068, lon: -43.1729 },
    { nome: "Brasília", estado: "DF", lat: -15.7801, lon: -47.9292 },
    { nome: "Salvador", estado: "BA", lat: -12.9714, lon: -38.5014 },
    { nome: "Curitiba", estado: "PR", lat: -25.4284, lon: -49.2733 }
];

// Mapeamento de Códigos WMO de Tempo do Open-Meteo
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

// Formatar data em dias da semana (Seg, Ter, Qua...)
function obterDiaSemana(dataIso, indice) {
    if (indice === 0) return "Hoje";
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const d = new Date(dataIso + "T00:00:00");
    return dias[d.getDay()];
}

async function inicio(app, queryParams = {}) {
    let cidadeNome = queryParams.cidade || "São Paulo, Brasil";
    let lat = -23.5505;
    let lon = -46.6333;

    // Se o usuário buscou uma cidade específica na barra superior
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

    // Atualiza o indicador de localização no navbar
    const locationTextElem = document.getElementById("current-location-text");
    if (locationTextElem) {
        locationTextElem.textContent = cidadeNome;
    }

    // Requisição principal de clima ao Open-Meteo
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

    const atual = climaData.current_weather;
    const infoWmo = traduzirClimaWmo(atual.weathercode);
    const tempAtual = Math.round(atual.temperature);
    const ventoSpeed = Math.round(atual.windspeed);
    
    // Pegar umidade atual do primeiro horário
    const umidadeAtual = climaData.hourly.relative_humidity_2m[0] || 50;

    // Formatar horários de sol
    const nascerSol = climaData.daily.sunrise[0] ? climaData.daily.sunrise[0].split("T")[1] : "06:00";
    const porSol = climaData.daily.sunset[0] ? climaData.daily.sunset[0].split("T")[1] : "18:30";

    // -------------------------------------------------------------
    // RENDERIZAÇÃO DA INTERFACE (DESKTOP GRID + MOBILE MINIMALIST)
    // -------------------------------------------------------------

    app.innerHTML = `
        <!-- 1. VISUAL MOBILE MINIMALISTA (Inspirado na Imagem de Referência 2) -->
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

            <!-- Carrossel por Hora (Hourly Forecast) -->
            <div class="mobile-hourly-section">
                <h3>🕒 Previsão por Hora</h3>
                <div class="hourly-carousel">
                    ${climaData.hourly.time.slice(0, 12).map((timeStr, idx) => {
                        const hora = timeStr.split("T")[1].substring(0, 5);
                        const tHora = Math.round(climaData.hourly.temperature_2m[idx]);
                        const codeHora = climaData.hourly.weather_code[idx];
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

        <!-- 2. VISUAL DESKTOP DASHBOARD (Inspirado na Imagem de Referência 1) -->
        <div class="dashboard-grid">
            <!-- Coluna Esquerda (Principal) -->
            <div class="dashboard-left">
                <!-- Cabeçalho de Abas -->
                <div class="dashboard-tabs">
                    <div class="dashboard-tabs__list">
                        <button class="dashboard-tabs__btn dashboard-tabs__btn--active">Hoje</button>
                        <button class="dashboard-tabs__btn">Amanhã</button>
                        <button class="dashboard-tabs__btn">Próximos 7 dias</button>
                    </div>
                </div>

                <!-- Grid Semanal de 7 Dias -->
                <div class="forecast-weekly-grid">
                    <!-- Card de Destaque (Hero) da Cidade Ativa -->
                    <div class="weekly-card weekly-card--hero">
                        <div style="display: flex; justify-content: space-between; width: 100%;">
                            <div>
                                <div class="weekly-card__day">${obterDiaSemana(climaData.daily.time[0], 0)}</div>
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

                    <!-- Cards dos Próximos Dias -->
                    ${climaData.daily.time.slice(1, 6).map((dataStr, index) => {
                        const idx = index + 1;
                        const tMax = Math.round(climaData.daily.temperature_2m_max[idx]);
                        const tMin = Math.round(climaData.daily.temperature_2m_min[idx]);
                        const iconeDia = traduzirClimaWmo(climaData.daily.weather_code[idx]).icone;

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

                <!-- Card de Mapa Global e Nacional -->
                <div class="map-card" style="background-image: linear-gradient(rgba(15, 18, 26, 0.7), rgba(15, 18, 26, 0.9)), url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1000&q=80');">
                    <div class="map-card__content">
                        <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">🗺️ Condições do Tempo no Brasil</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Monitoramento meteorológico em tempo real por estados.</p>
                    </div>

                    <div class="map-pins-container">
                        <div class="map-pin" style="top: 60%; left: 55%;">📍 SP 22° ☀️</div>
                        <div class="map-pin" style="top: 55%; left: 62%;">📍 RJ 28° ⛅</div>
                        <div class="map-pin" style="top: 40%; left: 50%;">📍 DF 25° ☀️</div>
                        <div class="map-pin" style="top: 35%; left: 65%;">📍 BA 30° 🌧️</div>
                    </div>
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
                                <div class="city-item__temp">
                                    <span>24°</span>
                                    <span style="font-size: 1.1rem;">☀️</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export default {
    url: "#inicio",
    label: "Dashboard",
    icone: "🌤️",
    pagina: inicio
};
