import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";

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

function obterIconeClimaSvg(codigo) {
    if (codigo === 0) return SVG_ICONS.weatherSun;
    if ([1, 2, 3].includes(codigo)) return SVG_ICONS.weatherCloudSun;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) return SVG_ICONS.weatherRain;
    return SVG_ICONS.weatherCloudSun;
}

async function capitais(app) {
    const capitaisComClima = await Promise.all(CAPITAIS_BR_8.map(async (c) => {
        try {
            const climaData = await buscarServicos(
                "https://api.open-meteo.com/v1/forecast",
                {
                    latitude: c.lat,
                    longitude: c.lon,
                    current_weather: true,
                    hourly: "relative_humidity_2m",
                    timezone: "America/Sao_Paulo"
                },
                `capital-br-${c.id}`
            );

            const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
            const temp = Math.round(atual.temperature);
            const vento = Math.round(atual.windspeed);
            const iconeSvg = obterIconeClimaSvg(atual.weathercode);
            const umidade = climaData?.hourly?.relative_humidity_2m?.[0] ?? 55;

            return {
                ...c,
                temp: `${temp}°C`,
                sensacao: `${temp - 1}°C`,
                vento: `${vento} km/h`,
                umidade: `${umidade}%`,
                iconeSvg
            };
        } catch (e) {
            console.error(`Erro ao carregar clima para ${c.nome}:`, e);
            return {
                ...c,
                temp: "--°C",
                sensacao: "Erro API",
                vento: "-- km/h",
                umidade: "--%",
                iconeSvg: SVG_ICONS.weatherCloudSun
            };
        }
    }));

    app.innerHTML = `
        <div class="capitais-container">
            <div class="capitais-header">
                <h1 class="capitais-title">${SVG_ICONS.capitals} Clima nas Capitais do Brasil</h1>
                <p class="capitais-subtitle">Monitoramento meteorológico em tempo real nas 8 principais metrópoles nacionais.</p>
            </div>

            <div id="grid-capitais-br" class="capitais-grid">
                ${capitaisComClima.map(c => `
                    <div class="capital-card" id="card-capital-${c.id}">
                        <div class="capital-card__top">
                            <div>
                                <h3 class="capital-card__name">${c.nome}</h3>
                                <span class="capital-card__state">${c.estado} • Brasil</span>
                            </div>
                            <span class="capital-card__icon" id="icon-cap-${c.id}">${c.iconeSvg}</span>
                        </div>

                        <div class="capital-card__bottom">
                            <div class="capital-card__temp" id="temp-cap-${c.id}">${c.temp}</div>
                            <button class="capital-card__btn-toggle" data-id="${c.id}" id="btn-toggle-cap-${c.id}">
                                <span>Ver detalhes</span>
                                ${SVG_ICONS.chevronDown}
                            </button>
                        </div>

                        <!-- Accordion Expansível de Detalhes Climáticos -->
                        <div class="capital-card__accordion" id="accordion-cap-${c.id}">
                            <div class="accordion-grid">
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Sensação</span>
                                    <span class="accordion-item__val" id="sensacao-cap-${c.id}">${c.sensacao}</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Vento</span>
                                    <span class="accordion-item__val" id="vento-cap-${c.id}">${c.vento}</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Umidade</span>
                                    <span class="accordion-item__val" id="umidade-cap-${c.id}">${c.umidade}</span>
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

    initAccordionEvents();
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
                    btn.innerHTML = `<span>Ver detalhes</span> ${SVG_ICONS.chevronDown}`;
                } else {
                    accordion.classList.add('capital-card__accordion--open');
                    btn.innerHTML = `<span>Recolher</span> ${SVG_ICONS.chevronUp}`;
                }
            }
        });
    });
}

export default {
    url: "#capitais",
    label: "Capitais",
    icone: SVG_ICONS.capitals,
    pagina: capitais
};
