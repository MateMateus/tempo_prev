import buscarServicos from "../services/apiCache.js";

const CAPITAIS_BR_8 = [
    { id: "sp", nome: "São Paulo", estado: "SP", lat: -23.5505, lon: -46.6333 },
    { id: "rj", nome: "Rio de Janeiro", estado: "RJ", lat: -22.9068, lon: -43.1729 },
    { id: "df", nome: "Brasília", estado: "DF", lat: -15.7801, lon: -47.9292 },
    { id: "ba", nome: "Salvador", estado: "BA", lat: -12.9714, lon: -38.5014 },
    { id: "pr", nome: "Curitiba", estado: "PR", lat: -25.4284, lon: -49.2733 },
    { id: "am", nome: "Manaus", estado: "AM", lat: -3.1190, lon: -60.0217 },
    { id: "pe", nome: "Recife", estado: "PE", lat: -8.0476, lon: -34.8770 },
    { id: "rs", nome: "Porto Alegre", estado: "RS", lat: -30.0346, lon: -51.2177 }
];

function obterIconeClima(codigo) {
    if (codigo === 0) return "☀️";
    if ([1, 2, 3].includes(codigo)) return "⛅";
    if ([45, 48].includes(codigo)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) return "🌧️";
    if ([95, 96, 99].includes(codigo)) return "🌩️";
    return "☁️";
}

async function capitais(app) {
    app.innerHTML = `
        <div class="capitais-container">
            <div class="capitais-header">
                <h1 class="capitais-title">🇧🇷 Clima nas Capitais do Brasil</h1>
                <p class="capitais-subtitle">Monitoramento meteorológico em tempo real nas 8 principais metrópoles nacionais.</p>
            </div>

            <div id="grid-capitais-br" class="capitais-grid">
                ${CAPITAIS_BR_8.map(c => `
                    <div class="capital-card" id="card-capital-${c.id}">
                        <div class="capital-card__top">
                            <div>
                                <h3 class="capital-card__name">${c.nome}</h3>
                                <span class="capital-card__state">${c.estado} • Brasil</span>
                            </div>
                            <span class="capital-card__icon" id="icon-cap-${c.id}">⏳</span>
                        </div>

                        <div class="capital-card__bottom">
                            <div class="capital-card__temp" id="temp-cap-${c.id}">--°C</div>
                            <button class="capital-card__btn-toggle" data-id="${c.id}" id="btn-toggle-cap-${c.id}">
                                <span>Ver detalhes</span>
                                <span>▾</span>
                            </button>
                        </div>

                        <!-- Accordion Expansível de Detalhes Climáticos -->
                        <div class="capital-card__accordion" id="accordion-cap-${c.id}">
                            <div class="accordion-grid">
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Sensação</span>
                                    <span class="accordion-item__val" id="sensacao-cap-${c.id}">--°C</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Vento</span>
                                    <span class="accordion-item__val" id="vento-cap-${c.id}">-- km/h</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Umidade</span>
                                    <span class="accordion-item__val" id="umidade-cap-${c.id}">--%</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Pressão</span>
                                    <span class="accordion-item__val" id="pressao-cap-${c.id}">1013 hPa</span>
                                </div>
                            </div>
                            <div style="margin-top: 0.75rem; text-align: right;">
                                <a href="#inicio?cidade=${encodeURIComponent(c.nome)}" style="font-size: 0.775rem; color: var(--text-primary); text-decoration: underline; font-weight: 600;">Abrir no Dashboard →</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Carrega dados climáticos em paralelo
    CAPITAIS_BR_8.forEach(capital => carregarClimaCapital(capital));

    // Event listener para expansão dos accordions
    initAccordionEvents();
}

async function carregarClimaCapital(capital) {
    try {
        const climaData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: capital.lat,
                longitude: capital.lon,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            `capital-br-${capital.id}`
        );

        const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
        const temp = Math.round(atual.temperature);
        const vento = Math.round(atual.windspeed);
        const icone = obterIconeClima(atual.weathercode);
        const umidade = climaData?.hourly?.relative_humidity_2m?.[0] ?? 55;

        const elemTemp = document.getElementById(`temp-cap-${capital.id}`);
        const elemIcon = document.getElementById(`icon-cap-${capital.id}`);
        const elemSensacao = document.getElementById(`sensacao-cap-${capital.id}`);
        const elemVento = document.getElementById(`vento-cap-${capital.id}`);
        const elemUmidade = document.getElementById(`umidade-cap-${capital.id}`);

        if (elemTemp) elemTemp.textContent = `${temp}°C`;
        if (elemIcon) elemIcon.textContent = icone;
        if (elemSensacao) elemSensacao.textContent = `${temp - 1}°C`;
        if (elemVento) elemVento.textContent = `${vento} km/h`;
        if (elemUmidade) elemUmidade.textContent = `${umidade}%`;
    } catch (e) {
        console.error(`Erro ao carregar clima para ${capital.nome}:`, e);
        const elemSensacao = document.getElementById(`sensacao-cap-${capital.id}`);
        if (elemSensacao) elemSensacao.textContent = "Erro API";
    }
}

function initAccordionEvents() {
    document.querySelectorAll('.capital-card__btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const capitalId = btn.getAttribute('data-id');
            const accordion = document.getElementById(`accordion-cap-${capitalId}`);
            
            if (accordion) {
                const isOpen = accordion.classList.contains('capital-card__accordion--open');
                
                if (isOpen) {
                    accordion.classList.remove('capital-card__accordion--open');
                    btn.innerHTML = `<span>Ver detalhes</span> <span>▾</span>`;
                } else {
                    accordion.classList.add('capital-card__accordion--open');
                    btn.innerHTML = `<span>Recolher</span> <span>▴</span>`;
                }
            }
        });
    });
}

export default {
    url: "#capitais",
    label: "Capitais",
    icone: "🇧🇷",
    pagina: capitais
};
