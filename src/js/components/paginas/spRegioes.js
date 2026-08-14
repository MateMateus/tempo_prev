import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { obterIconeClimaSvg } from "../../utils/weatherUtils.js";
import { initAccordionEvents } from "../../utils/accordion.js";
import { renderGridSkeleton, gerarSlugCidade } from "../../utils/uiHelpers.js";

const REGIOES_SP = [
    { id: "capital", nome: "Capital / Grande SP", cidade: "São Paulo", lat: -23.5505, lon: -46.6333 },
    { id: "campinas", nome: "Região de Campinas", cidade: "Campinas", lat: -22.9056, lon: -47.0608 },
    { id: "valeparaiba", nome: "Vale do Paraíba", cidade: "São José dos Campos", lat: -23.1794, lon: -45.8869 },
    { id: "baixadasantista", nome: "Baixada Santista", cidade: "Santos", lat: -23.9608, lon: -46.3339 },
    { id: "ribeiraopreto", nome: "Ribeirão Preto", cidade: "Ribeirão Preto", lat: -21.1704, lon: -47.8103 },
    { id: "sorocaba", nome: "Região de Sorocaba", cidade: "Sorocaba", lat: -23.5017, lon: -47.4581 },
    { id: "riopreto", nome: "S. J. do Rio Preto", cidade: "São José do Rio Preto", lat: -20.8197, lon: -49.3794 },
    { id: "bauru", nome: "Região de Bauru", cidade: "Bauru", lat: -22.3145, lon: -49.0587 }
];

async function spRegioes(app) {
    // Renderiza a estrutura inicial com Skeleton Loader imediatamente
    app.innerHTML = `
        <div class="regioes-container">
            <div class="regioes-header">
                <h1 class="regioes-title">${SVG_ICONS.map} Clima nas Regiões de São Paulo</h1>
                <p class="regioes-subtitle">Monitoramento em tempo real das 8 principais macrorregiões e polos econômicos do Estado de SP.</p>
            </div>

            <div id="grid-regioes-sp" class="regioes-grid">
                ${renderGridSkeleton(8)}
            </div>
        </div>
    `;

    const regioesComClima = await Promise.all(REGIOES_SP.map(async (r) => {
        try {
            const climaData = await buscarServicos(
                "https://api.open-meteo.com/v1/forecast",
                {
                    latitude: r.lat,
                    longitude: r.lon,
                    current_weather: true,
                    hourly: "relative_humidity_2m",
                    timezone: "America/Sao_Paulo"
                },
                `regiao-sp-${r.id}`
            );

            const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
            const temp = Math.round(atual.temperature);
            const vento = Math.round(atual.windspeed);
            const iconeSvg = obterIconeClimaSvg(atual.weathercode);
            const umidade = climaData?.hourly?.relative_humidity_2m?.[0] ?? 55;

            return {
                ...r,
                temp: `${temp}°C`,
                sensacao: `${temp - 1}°C`,
                vento: `${vento} km/h`,
                umidade: `${umidade}%`,
                iconeSvg
            };
        } catch (e) {
            console.error(`Erro ao carregar clima para ${r.nome}:`, e);
            return {
                ...r,
                temp: "--°C",
                sensacao: "Erro API",
                vento: "-- km/h",
                umidade: "--%",
                iconeSvg: SVG_ICONS.weatherCloudSun
            };
        }
    }));

    const gridContainer = document.getElementById("grid-regioes-sp");
    if (gridContainer) {
        gridContainer.innerHTML = regioesComClima.map(r => `
            <div class="regiao-card" id="card-regiao-${r.id}">
                <div class="regiao-card__top">
                    <div>
                        <h3 class="regiao-card__name">${r.nome}</h3>
                        <span class="regiao-card__state">${r.cidade} • SP</span>
                    </div>
                    <span class="regiao-card__icon" id="icon-${r.id}">${r.iconeSvg}</span>
                </div>

                <div class="regiao-card__bottom">
                    <div class="regiao-card__temp" id="temp-${r.id}">${r.temp}</div>
                    <button class="regiao-card__btn-toggle" data-id="${r.id}" id="btn-toggle-${r.id}">
                        <span>Ver detalhes</span>
                        ${SVG_ICONS.chevronDown}
                    </button>
                </div>

                <!-- Accordion Expansível de Detalhes Climáticos -->
                <div class="regiao-card__accordion" id="accordion-${r.id}">
                    <div class="accordion-grid">
                        <div class="accordion-item">
                            <span class="accordion-item__label">Sensação</span>
                            <span class="accordion-item__val" id="sensacao-${r.id}">${r.sensacao}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Vento</span>
                            <span class="accordion-item__val" id="vento-${r.id}">${r.vento}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Umidade</span>
                            <span class="accordion-item__val" id="umidade-${r.id}">${r.umidade}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Pressão</span>
                            <span class="accordion-item__val" id="pressao-${r.id}">1013 hPa</span>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; text-align: right;">
                        <a href="#clima/${gerarSlugCidade(r.cidade)}" style="font-size: 0.775rem; color: var(--text-primary); text-decoration: underline; font-weight: 600;">Abrir no Dashboard →</a>
                    </div>
                </div>
            </div>
        `).join('');

        initAccordionEvents('.regiao-card__btn-toggle', 'accordion-', 'regiao-card__accordion--open');
    }
}

export default {
    url: "#sp-regioes",
    label: "Regiões de SP",
    icone: SVG_ICONS.map,
    pagina: spRegioes
};
