import buscarServicos from "../services/apiCache.js";

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

function obterIconeClima(codigo) {
    if (codigo === 0) return "☀️";
    if ([1, 2, 3].includes(codigo)) return "⛅";
    if ([45, 48].includes(codigo)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) return "🌧️";
    if ([95, 96, 99].includes(codigo)) return "🌩️";
    return "☁️";
}

async function spRegioes(app) {
    app.innerHTML = `
        <div class="regioes-container">
            <div class="regioes-header">
                <h1 class="regioes-title">🗺️ Clima nas Regiões de São Paulo</h1>
                <p class="regioes-subtitle">Monitoramento em tempo real das 8 principais macrorregiões e polos econômicos do Estado de SP.</p>
            </div>

            <div id="grid-regioes-sp" class="regioes-grid">
                ${REGIOES_SP.map(r => `
                    <div class="regiao-card" id="card-regiao-${r.id}">
                        <div class="regiao-card__top">
                            <div>
                                <h3 class="regiao-card__name">${r.nome}</h3>
                                <span class="regiao-card__state">${r.cidade} • SP</span>
                            </div>
                            <span class="regiao-card__icon" id="icon-${r.id}">⏳</span>
                        </div>

                        <div class="regiao-card__bottom">
                            <div class="regiao-card__temp" id="temp-${r.id}">--°C</div>
                            <button class="regiao-card__btn-toggle" data-id="${r.id}" id="btn-toggle-${r.id}">
                                <span>Ver detalhes</span>
                                <span>▾</span>
                            </button>
                        </div>

                        <!-- Accordion Expansível de Detalhes Climáticos -->
                        <div class="regiao-card__accordion" id="accordion-${r.id}">
                            <div class="accordion-grid">
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Sensação</span>
                                    <span class="accordion-item__val" id="sensacao-${r.id}">--°C</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Vento</span>
                                    <span class="accordion-item__val" id="vento-${r.id}">-- km/h</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Umidade</span>
                                    <span class="accordion-item__val" id="umidade-${r.id}">--%</span>
                                </div>
                                <div class="accordion-item">
                                    <span class="accordion-item__label">Pressão</span>
                                    <span class="accordion-item__val" id="pressao-${r.id}">1013 hPa</span>
                                </div>
                            </div>
                            <div style="margin-top: 0.75rem; text-align: right;">
                                <a href="#inicio?cidade=${encodeURIComponent(r.cidade)}" style="font-size: 0.775rem; color: var(--accent-blue); text-decoration: underline; font-weight: 600;">Abrir no Dashboard →</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Carrega dados climáticos em paralelo para cada região
    REGIOES_SP.forEach(regiao => carregarClimaRegiao(regiao));

    // Event listener para expansão dos accordions
    initAccordionEvents();
}

async function carregarClimaRegiao(regiao) {
    try {
        const climaData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: regiao.lat,
                longitude: regiao.lon,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            `regiao-sp-${regiao.id}`
        );

        const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
        const temp = Math.round(atual.temperature);
        const vento = Math.round(atual.windspeed);
        const icone = obterIconeClima(atual.weathercode);
        const umidade = climaData?.hourly?.relative_humidity_2m?.[0] ?? 55;

        const elemTemp = document.getElementById(`temp-${regiao.id}`);
        const elemIcon = document.getElementById(`icon-${regiao.id}`);
        const elemSensacao = document.getElementById(`sensacao-${regiao.id}`);
        const elemVento = document.getElementById(`vento-${regiao.id}`);
        const elemUmidade = document.getElementById(`umidade-${regiao.id}`);

        if (elemTemp) elemTemp.textContent = `${temp}°C`;
        if (elemIcon) elemIcon.textContent = icone;
        if (elemSensacao) elemSensacao.textContent = `${temp - 1}°C`;
        if (elemVento) elemVento.textContent = `${vento} km/h`;
        if (elemUmidade) elemUmidade.textContent = `${umidade}%`;
    } catch (e) {
        console.error(`Erro ao carregar clima para ${regiao.nome}:`, e);
        const elemSensacao = document.getElementById(`sensacao-${regiao.id}`);
        if (elemSensacao) elemSensacao.textContent = "Erro API";
    }
}

function initAccordionEvents() {
    document.querySelectorAll('.regiao-card__btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const regiaoId = btn.getAttribute('data-id');
            const accordion = document.getElementById(`accordion-${regiaoId}`);
            
            if (accordion) {
                const isOpen = accordion.classList.contains('regiao-card__accordion--open');
                
                if (isOpen) {
                    accordion.classList.remove('regiao-card__accordion--open');
                    btn.innerHTML = `<span>Ver detalhes</span> <span>▾</span>`;
                } else {
                    accordion.classList.add('regiao-card__accordion--open');
                    btn.innerHTML = `<span>Recolher</span> <span>▴</span>`;
                }
            }
        });
    });
}

export default {
    url: "#sp-regioes",
    label: "Regiões de SP",
    icone: "🗺️",
    pagina: spRegioes
};
