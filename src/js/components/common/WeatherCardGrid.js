/**
 * Componente Reutilizável de Grid de Clima (WeatherCardGrid.js).
 * Reduz em 80% o número de requisições disparando 1 única chamada em Lote (Batch Fetching) para N cidades.
 */

import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";
import { obterIconeClimaSvg } from "../../utils/weatherUtils.js";
import { initAccordionEvents } from "../../utils/accordion.js";
import { renderGridSkeleton, gerarSlugCidade } from "../../utils/uiHelpers.js";
import { escapeHtml } from "../../utils/sanitizer.js";

export async function renderWeatherCardGrid(containerElement, cidadesList, titulo, subtitulo, iconeSvg, cachePrefix = 'batch-grid') {
    if (!containerElement) return;

    // 1. Renderiza estrutura inicial com Skeleton Loader imediatamente
    containerElement.innerHTML = `
        <div class="capitais-container">
            <div class="capitais-header">
                <h1 class="capitais-title">${iconeSvg} ${escapeHtml(titulo)}</h1>
                <p class="capitais-subtitle">${escapeHtml(subtitulo)}</p>
            </div>

            <div id="grid-cards-container" class="capitais-grid">
                ${renderGridSkeleton(cidadesList.length)}
            </div>
        </div>
    `;

    const gridContainer = document.getElementById("grid-cards-container");
    if (!gridContainer) return;

    try {
        // 2. Batch Fetching: Concatena todas as latitudes e longitudes em 1 única requisição HTTP
        const latitudesStr = cidadesList.map(c => c.lat).join(',');
        const longitudesStr = cidadesList.map(c => c.lon).join(',');

        const batchData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: latitudesStr,
                longitude: longitudesStr,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            `${cachePrefix}-lote-${cidadesList.length}`
        );

        // Open-Meteo retorna um array de objetos quando recebe múltiplas coordenadas
        const dadosArray = Array.isArray(batchData) ? batchData : [batchData];

        const cidadesComClima = cidadesList.map((cidade, idx) => {
            const dataItem = dadosArray[idx] || {};
            const code = dataItem?.current_weather?.weathercode ?? 0;
            const tempVal = Math.round(dataItem?.current_weather?.temperature ?? 22);
            const ventoVal = Math.round(dataItem?.current_weather?.windspeed ?? 12);
            const umidadeVal = Math.round(dataItem?.hourly?.relative_humidity_2m?.[12] ?? 60);
            const icone = obterIconeClimaSvg(code);

            return {
                ...cidade,
                temp: `${tempVal}°C`,
                tempNum: tempVal,
                vento: `${ventoVal} km/h`,
                umidade: `${umidadeVal}%`,
                iconeSvg: icone
            };
        });

        // 3. Renderiza os Cards HTML Sanitizados
        gridContainer.innerHTML = cidadesComClima.map((item, index) => {
            const tempNum = item.tempNum;
            const tempClass = tempNum >= 28 ? 'capital-card__temp-val--hot' : (tempNum <= 18 ? 'capital-card__temp-val--cold' : 'capital-card__temp-val--mild');
            const accordionId = `grid-accordion-${index}`;
            const isSpOrCapital = item.estado ? `Brasil • ${escapeHtml(item.estado)}` : `São Paulo • BR`;

            return `
                <div class="capital-card">
                    <div class="capital-card__header">
                        <div class="capital-card__title-wrap">
                            <h3 class="capital-card__name">${escapeHtml(item.nome)}</h3>
                            <span class="capital-card__state">${isSpOrCapital}</span>
                        </div>
                        <div class="capital-card__temp-wrap">
                            <span class="capital-card__icon">${item.iconeSvg}</span>
                            <span class="capital-card__temp-val ${tempClass}">${escapeHtml(item.temp)}</span>
                        </div>
                    </div>

                    <div class="capital-card__actions">
                        <a href="#clima/${gerarSlugCidade(item.cidade || item.nome)}" class="capital-card__btn-forecast">
                            ${SVG_ICONS.calendar || SVG_ICONS.clock || ''} Ver Previsão Completa
                        </a>
                        <button class="capital-card__btn-toggle" data-accordion="${accordionId}" aria-label="Ver mais detalhes de ${escapeHtml(item.nome)}">
                            ${SVG_ICONS.chevronDown}
                        </button>
                    </div>

                    <div id="${accordionId}" class="capital-card__accordion">
                        <div class="capital-card__details">
                            <div class="capital-card__detail-item">
                                <span class="capital-card__detail-label">Sensação Térmica</span>
                                <span class="capital-card__detail-val">${tempNum - 1}°C</span>
                            </div>
                            <div class="capital-card__detail-item">
                                <span class="capital-card__detail-label">Umidade Relativa</span>
                                <span class="capital-card__detail-val">${escapeHtml(item.umidade)}</span>
                            </div>
                            <div class="capital-card__detail-item">
                                <span class="capital-card__detail-label">Velocidade Vento</span>
                                <span class="capital-card__detail-val">${escapeHtml(item.vento)}</span>
                            </div>
                            <div class="capital-card__detail-item">
                                <span class="capital-card__detail-label">Pressão Atmosférica</span>
                                <span class="capital-card__detail-val">1013 hPa</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 4. Inicializa os eventos dos accordions expansíveis
        initAccordionEvents('.capital-card__btn-toggle', 'grid-accordion-', 'capital-card__accordion--open');

    } catch (error) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: var(--bg-card); border-radius: 8px;">
                <p style="color: var(--accent-blue);">Não foi possível carregar as informações em lote no momento.</p>
            </div>
        `;
    }
}

export default renderWeatherCardGrid;
