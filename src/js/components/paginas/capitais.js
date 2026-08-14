import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { obterIconeClimaSvg } from "../../utils/weatherUtils.js";
import { renderGridSkeleton, gerarSlugCidade } from "../../utils/uiHelpers.js";
import { escapeHtml } from "../../utils/sanitizer.js";

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

async function mount(container) {
    if (!container) return;

    // Renderiza a estrutura HTML original com Skeleton Loader
    container.innerHTML = `
        <div class="capitais-container">
            <div class="capitais-header">
                <h1 class="capitais-title">${SVG_ICONS.capitals} Clima nas Capitais do Brasil</h1>
                <p class="capitais-subtitle">Monitoramento meteorológico em tempo real nas 8 principais metrópoles nacionais.</p>
            </div>

            <div id="grid-capitais-br" class="capitais-grid">
                ${renderGridSkeleton(8)}
            </div>
        </div>
    `;

    const gridContainer = document.getElementById("grid-capitais-br");
    if (!gridContainer) return;

    try {
        // Batch Fetching: 1 única requisição HTTP para todas as coordenadas
        const lats = CAPITAIS_BR_8.map(c => c.lat).join(',');
        const lons = CAPITAIS_BR_8.map(c => c.lon).join(',');

        const batchData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: lats,
                longitude: lons,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            "capitais-br-batch-v4"
        );

        const dadosArray = Array.isArray(batchData) ? batchData : [batchData];

        const capitaisComClima = CAPITAIS_BR_8.map((cap, i) => {
            const data = dadosArray[i] || {};
            const atual = data?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
            const temp = Math.round(atual.temperature ?? 20);
            const vento = Math.round(atual.windspeed ?? 10);
            const umidade = Math.round(data?.hourly?.relative_humidity_2m?.[12] ?? 55);
            const iconeSvg = obterIconeClimaSvg(atual.weathercode ?? 0);

            return {
                ...cap,
                temp: `${temp}°C`,
                sensacao: `${temp - 1}°C`,
                vento: `${vento} km/h`,
                umidade: `${umidade}%`,
                iconeSvg: iconeSvg || SVG_ICONS.weatherSun
            };
        });

        // Renderiza a estrutura HTML original fiel do card de capitais
        gridContainer.innerHTML = capitaisComClima.map(c => `
            <div class="capital-card">
                <div class="capital-card__top">
                    <div>
                        <h3 class="capital-card__name">${escapeHtml(c.nome)}</h3>
                        <span class="capital-card__state">Brasil • ${escapeHtml(c.estado)}</span>
                    </div>
                    <span class="capital-card__icon">${c.iconeSvg}</span>
                </div>

                <div class="capital-card__bottom">
                    <div class="capital-card__temp">${escapeHtml(c.temp)}</div>
                    <button class="capital-card__btn-toggle" data-id="${c.id}" id="btn-toggle-cap-${c.id}" aria-label="Ver mais detalhes de ${escapeHtml(c.nome)}">
                        <span>Ver detalhes</span>
                        ${SVG_ICONS.chevronDown || '<span>˅</span>'}
                    </button>
                </div>

                <div class="capital-card__accordion" id="accordion-cap-${c.id}">
                    <div class="accordion-grid">
                        <div class="accordion-item">
                            <span class="accordion-item__label">Sensação</span>
                            <span class="accordion-item__val">${escapeHtml(c.sensacao)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Vento</span>
                            <span class="accordion-item__val">${escapeHtml(c.vento)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Umidade</span>
                            <span class="accordion-item__val">${escapeHtml(c.umidade)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Pressão</span>
                            <span class="accordion-item__val">1013 hPa</span>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; text-align: right;">
                        <a href="#clima/${gerarSlugCidade(c.nome)}" class="accordion-link">Abrir no Dashboard →</a>
                    </div>
                </div>
            </div>
        `).join('');

        initAccordionEvents();

    } catch (err) {
        console.error("Erro ao carregar capitais:", err);
    }
}

function initAccordionEvents() {
    document.querySelectorAll('.capital-card__btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const accordion = document.getElementById(`accordion-cap-${id}`);
            if (accordion) {
                const isOpen = accordion.classList.contains('capital-card__accordion--open');
                
                if (isOpen) {
                    accordion.classList.remove('capital-card__accordion--open');
                    btn.innerHTML = `<span>Ver detalhes</span> ${SVG_ICONS.chevronDown || '<span>˅</span>'}`;
                } else {
                    accordion.classList.add('capital-card__accordion--open');
                    btn.innerHTML = `<span>Recolher</span> ${SVG_ICONS.chevronUp || '<span>˄</span>'}`;
                }
            }
        });
    });
}

function unmount() {}

export default {
    url: "#capitais",
    label: "Capitais",
    icone: SVG_ICONS.capitals,
    mount,
    unmount,
    pagina: mount,
    cleanup: unmount
};
