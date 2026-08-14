import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { obterIconeClimaSvg } from "../../utils/weatherUtils.js";
import { renderGridSkeleton, gerarSlugCidade } from "../../utils/uiHelpers.js";
import { escapeHtml } from "../../utils/sanitizer.js";

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

async function mount(container) {
    if (!container) return;

    // Renderiza a estrutura HTML original com Skeleton Loader
    container.innerHTML = `
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

    const gridContainer = document.getElementById("grid-regioes-sp");
    if (!gridContainer) return;

    try {
        // Batch Fetching: 1 única requisição HTTP para todas as coordenadas
        const lats = REGIOES_SP.map(r => r.lat).join(',');
        const lons = REGIOES_SP.map(r => r.lon).join(',');

        const batchData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: lats,
                longitude: lons,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            "sp-regioes-batch-v4"
        );

        const dadosArray = Array.isArray(batchData) ? batchData : [batchData];

        const regioesComClima = REGIOES_SP.map((reg, i) => {
            const data = dadosArray[i] || {};
            const atual = data?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
            const temp = Math.round(atual.temperature ?? 20);
            const vento = Math.round(atual.windspeed ?? 10);
            const umidade = Math.round(data?.hourly?.relative_humidity_2m?.[12] ?? 60);
            const iconeSvg = obterIconeClimaSvg(atual.weathercode ?? 0);

            return {
                ...reg,
                temp: `${temp}°C`,
                sensacao: `${temp - 1}°C`,
                vento: `${vento} km/h`,
                umidade: `${umidade}%`,
                iconeSvg: iconeSvg || SVG_ICONS.weatherSun
            };
        });

        // Renderiza a estrutura HTML original fiel do card de regiões de SP
        gridContainer.innerHTML = regioesComClima.map(r => `
            <div class="regiao-card">
                <div class="regiao-card__top">
                    <div>
                        <h3 class="regiao-card__name">${escapeHtml(r.nome)}</h3>
                        <span class="regiao-card__state">São Paulo • BR</span>
                    </div>
                    <span class="regiao-card__icon">${r.iconeSvg}</span>
                </div>

                <div class="regiao-card__bottom">
                    <div class="regiao-card__temp">${escapeHtml(r.temp)}</div>
                    <button class="regiao-card__btn-toggle" data-id="${r.id}" id="btn-toggle-reg-${r.id}" aria-label="Ver mais detalhes de ${escapeHtml(r.nome)}">
                        <span>Ver detalhes</span>
                        ${SVG_ICONS.chevronDown || '<span>˅</span>'}
                    </button>
                </div>

                <div class="regiao-card__accordion" id="accordion-${r.id}">
                    <div class="accordion-grid">
                        <div class="accordion-item">
                            <span class="accordion-item__label">Sensação</span>
                            <span class="accordion-item__val">${escapeHtml(r.sensacao)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Vento</span>
                            <span class="accordion-item__val">${escapeHtml(r.vento)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Umidade</span>
                            <span class="accordion-item__val">${escapeHtml(r.umidade)}</span>
                        </div>
                        <div class="accordion-item">
                            <span class="accordion-item__label">Pressão</span>
                            <span class="accordion-item__val">1013 hPa</span>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; text-align: right;">
                        <a href="#clima/${gerarSlugCidade(r.cidade)}" class="accordion-link">Abrir no Dashboard →</a>
                    </div>
                </div>
            </div>
        `).join('');

        initAccordionEvents();

    } catch (err) {
        console.error("Erro ao carregar regiões de SP:", err);
    }
}

function initAccordionEvents() {
    document.querySelectorAll('.regiao-card__btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const accordion = document.getElementById(`accordion-${id}`);
            if (accordion) {
                const isOpen = accordion.classList.contains('regiao-card__accordion--open');
                
                if (isOpen) {
                    accordion.classList.remove('regiao-card__accordion--open');
                    btn.innerHTML = `<span>Ver detalhes</span> ${SVG_ICONS.chevronDown || '<span>˅</span>'}`;
                } else {
                    accordion.classList.add('regiao-card__accordion--open');
                    btn.innerHTML = `<span>Recolher</span> ${SVG_ICONS.chevronUp || '<span>˄</span>'}`;
                }
            }
        });
    });
}

function unmount() {}

export default {
    url: "#sp-regioes",
    label: "Regiões de SP",
    icone: SVG_ICONS.map,
    mount,
    unmount,
    pagina: mount,
    cleanup: unmount
};
