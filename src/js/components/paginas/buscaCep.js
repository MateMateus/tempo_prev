import buscarServicos from "../services/apiCache.js";

async function buscaCep(app) {
    app.innerHTML = `
        <div class="cep-container">
            <div class="cep-card">
                <h1 class="cep-title">📍 Consulta de Clima por CEP</h1>
                <p class="cep-subtitle">Digite seu CEP brasileiro para localizar o endereço e obter a previsão meteorológica em tempo real da sua região.</p>

                <form id="form-busca-cep" class="cep-form">
                    <div class="cep-input-group">
                        <input 
                            type="text" 
                            id="input-cep" 
                            class="cep-input" 
                            placeholder="Digite o CEP (ex: 01001-000)..." 
                            maxlength="9" 
                            required
                        />
                    </div>
                    <button type="submit" class="cep-btn">
                        <span>🔍</span>
                        <span>Buscar Clima</span>
                    </button>
                </form>

                <div id="cep-resultado-area" class="cep-result-area"></div>
            </div>
        </div>
    `;

    const formCep = document.getElementById("form-busca-cep");
    const inputCep = document.getElementById("input-cep");

    // Máscara automática de CEP (00000-000)
    if (inputCep) {
        inputCep.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, "$1-$2");
            }
            e.target.value = value;
        });

        // Trigger automático de busca ao perder o foco (blur) conforme especificação
        inputCep.addEventListener("blur", async (e) => {
            const rawCep = e.target.value.replace(/\D/g, "");
            if (rawCep.length === 8) {
                await processarBuscaCep(rawCep);
            }
        });
    }

    if (formCep) {
        formCep.addEventListener("submit", async (e) => {
            e.preventDefault();
            const rawCep = inputCep.value.replace(/\D/g, "");
            if (rawCep.length !== 8) {
                alert("Por favor, digite um CEP válido com 8 dígitos.");
                return;
            }

            await processarBuscaCep(rawCep);
        });
    }
}

async function processarBuscaCep(cepLimpo) {
    const containerResultado = document.getElementById("cep-resultado-area");
    if (!containerResultado) return;

    containerResultado.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--accent-blue);">
            <h3>⏳ Consultando ViaCEP e dados meteorológicos...</h3>
        </div>
    `;

    try {
        // 1. Busca no ViaCEP via apiCache
        const viaCepUrl = `https://viacep.com.br/ws/${cepLimpo}/json/`;
        const dadosEndereco = await buscarServicos(viaCepUrl, {}, `viacep-${cepLimpo}`);

        if (!dadosEndereco || dadosEndereco.erro) {
            containerResultado.innerHTML = `
                <div style="padding: 1rem; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;">
                    ❌ CEP não encontrado. Verifique o número digitado.
                </div>
            `;
            return;
        }

        // 2. Converte Cidade/UF em Lat/Long via Geocoding
        const termoBusca = `${dadosEndereco.localidade}, ${dadosEndereco.uf}, Brasil`;
        const geoData = await buscarServicos(
            "https://geocoding-api.open-meteo.com/v1/search",
            { name: termoBusca, count: 1, language: "pt", format: "json" },
            `geo-${dadosEndereco.localidade}`
        );

        let lat = -23.5505;
        let lon = -46.6333;
        if (geoData && geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
        }

        // 3. Busca Previsão do Clima no Open-Meteo via apiCache
        const climaData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                daily: "temperature_2m_max,temperature_2m_min,weather_code",
                timezone: "America/Sao_Paulo"
            },
            `clima-cep-${cepLimpo}`
        );

        const atual = climaData?.current_weather || { temperature: 20, windspeed: 10 };
        const tempAtual = Math.round(atual.temperature);
        const vento = Math.round(atual.windspeed);

        // Renderiza resultado detalhado de Endereço + Clima
        containerResultado.innerHTML = `
            <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1rem;">
                <h3 style="font-family: var(--font-heading); margin-bottom: 1rem; color: var(--accent-blue);">
                    🏠 Endereço Localizado
                </h3>

                <div class="address-info-grid">
                    <div class="address-box">
                        <div class="address-box__label">CEP</div>
                        <div class="address-box__value">${dadosEndereco.cep}</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">Logradouro</div>
                        <div class="address-box__value">${dadosEndereco.logradouro || 'N/A'}</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">Bairro</div>
                        <div class="address-box__value">${dadosEndereco.bairro || 'N/A'}</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">Cidade / UF</div>
                        <div class="address-box__value">${dadosEndereco.localidade} - ${dadosEndereco.uf}</div>
                    </div>
                </div>

                <h3 style="font-family: var(--font-heading); margin-bottom: 1rem; color: var(--accent-cyan);">
                    🌤️ Clima Atual no CEP
                </h3>

                <div class="weekly-card weekly-card--hero" style="width: 100%; border-radius: var(--radius-lg);">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <div>
                            <div class="weekly-card__day">${dadosEndereco.localidade}, ${dadosEndereco.uf}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${dadosEndereco.bairro || 'Região central'}</div>
                        </div>
                        <div style="font-size: 2.8rem;">🌤️</div>
                    </div>
                    <div class="hero-card__temp-big" style="font-family: var(--font-number); font-size: 4.2rem;">${tempAtual}°C</div>
                    
                    <div class="hero-card__details-grid" style="grid-template-columns: repeat(3, 1fr);">
                        <div>Vento: ${vento} km/h</div>
                        <div>Latitude: ${lat.toFixed(2)}</div>
                        <div>Longitude: ${lon.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Erro na busca por CEP:", err);
        containerResultado.innerHTML = `
            <div style="padding: 1rem; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;">
                ❌ Erro ao consultar CEP ou serviço de clima. Tente novamente.
            </div>
        `;
    }
}

export default {
    url: "#busca-cep",
    label: "Busca por CEP",
    icone: "📍",
    pagina: buscaCep
};
