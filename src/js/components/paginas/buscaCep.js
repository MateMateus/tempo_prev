import buscarServicos from "../services/apiCache.js";
import { SVG_ICONS } from "../icons.js";

let cepMapInstance = null;
let cepTileLayerInstance = null;
let cepPolygonInstance = null;

function traduzirClimaWmo(codigo) {
    if (codigo === 0) return { texto: "Ensolarado e Limpo", iconeSvg: SVG_ICONS.weatherSun };
    if ([1, 2, 3].includes(codigo)) return { texto: "Parcialmente Nublado", iconeSvg: SVG_ICONS.weatherCloudSun };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) return { texto: "Chuva Moderada", iconeSvg: SVG_ICONS.weatherRain };
    return { texto: "Nublado", iconeSvg: SVG_ICONS.weatherCloudSun };
}

async function buscaCep(app) {
    app.innerHTML = `
        <div class="cep-container">
            <div class="cep-card">
                <h1 class="cep-title">${SVG_ICONS.location} Consulta de Clima por CEP</h1>
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
                        <span>${SVG_ICONS.search}</span>
                        <span>Buscar Clima</span>
                    </button>
                </form>

                <div id="cep-resultado-area" class="cep-result-area"></div>
            </div>
        </div>
    `;

    const formCep = document.getElementById("form-busca-cep");
    const inputCep = document.getElementById("input-cep");

    if (inputCep) {
        inputCep.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, "$1-$2");
            }
            e.target.value = value;
        });

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
        <div style="text-align: center; padding: 1.5rem; color: var(--text-primary);">
            <h3>Consultando ViaCEP e dados meteorológicos...</h3>
        </div>
    `;

    try {
        const viaCepUrl = `https://viacep.com.br/ws/${cepLimpo}/json/`;
        const dadosEndereco = await buscarServicos(viaCepUrl, {}, `viacep-${cepLimpo}`);

        if (!dadosEndereco || dadosEndereco.erro) {
            containerResultado.innerHTML = `
                <div style="padding: 1rem; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;">
                    CEP não encontrado. Verifique o número digitado.
                </div>
            `;
            return;
        }

        const bairroLogradouro = dadosEndereco.logradouro || dadosEndereco.bairro || dadosEndereco.localidade;
        const termoBusca = `${bairroLogradouro}, ${dadosEndereco.localidade}, ${dadosEndereco.uf}, Brasil`;

        const geoData = await buscarServicos(
            "https://geocoding-api.open-meteo.com/v1/search",
            { name: termoBusca, count: 1, language: "pt", format: "json" },
            `geo-${dadosEndereco.localidade}-${cepLimpo}`
        );

        let lat = -23.5505;
        let lon = -46.6333;
        if (geoData && geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
        }

        const climaData = await buscarServicos(
            "https://api.open-meteo.com/v1/forecast",
            {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                hourly: "relative_humidity_2m",
                timezone: "America/Sao_Paulo"
            },
            `clima-cep-${cepLimpo}`
        );

        const atual = climaData?.current_weather || { temperature: 20, windspeed: 10, weathercode: 0 };
        const tempAtual = Math.round(atual.temperature);
        const vento = Math.round(atual.windspeed);
        const sensacao = tempAtual - 1;
        const umidade = climaData?.hourly?.relative_humidity_2m?.[0] ?? 60;
        const infoWmo = traduzirClimaWmo(atual.weathercode);

        containerResultado.innerHTML = `
            <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1rem;">
                <h3 class="heading-with-icon" style="font-family: var(--font-heading); margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.6rem; font-size: 1.3rem;">
                    <span class="heading-icon-svg">${SVG_ICONS.location}</span>
                    <span>Endereço Localizado</span>
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

                <h3 class="heading-with-icon" style="font-family: var(--font-heading); margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.6rem; font-size: 1.3rem;">
                    <span class="heading-icon-svg">${SVG_ICONS.weatherCloudSun}</span>
                    <span>Clima Atual no Bairro</span>
                </h3>

                <div class="weekly-card weekly-card--hero" style="width: 100%; border-radius: var(--radius-lg);">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <div>
                            <div class="weekly-card__day">${dadosEndereco.localidade}, ${dadosEndereco.uf}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${dadosEndereco.bairro || 'Região central'}</div>
                        </div>
                        <div style="font-size: 2rem;">${infoWmo.iconeSvg}</div>
                    </div>
                    <div class="hero-card__temp-big" style="font-family: var(--font-number); font-size: 4.2rem;">${tempAtual}°C</div>
                    
                    <div class="hero-card__details-grid" style="grid-template-columns: repeat(4, 1fr);">
                        <div>Sensação: <strong>${sensacao}°C</strong></div>
                        <div>Umidade: <strong>${umidade}%</strong></div>
                        <div>Vento: <strong>${vento} km/h</strong></div>
                        <div>Condição: <strong>${infoWmo.texto}</strong></div>
                    </div>
                </div>

                <!-- Mini-Mapa do Bairro com Polígono Tracejado (dashArray: '6, 6') -->
                <div style="margin-top: 1.5rem;">
                    <h3 class="heading-with-icon" style="font-family: var(--font-heading); margin-bottom: 0.75rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.6rem;">
                        <span class="heading-icon-svg">${SVG_ICONS.map}</span>
                        <span>Área Geográfica do Bairro</span>
                    </h3>
                    <div id="cep-map"></div>
                </div>
            </div>
        `;

        await initCepMiniMap(lat, lon, dadosEndereco.bairro, dadosEndereco.localidade);

    } catch (err) {
        console.error("Erro na busca por CEP:", err);
        containerResultado.innerHTML = `
            <div style="padding: 1rem; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;">
                Erro ao consultar CEP ou serviço de clima. Tente novamente.
            </div>
        `;
    }
}

// Inicializa o Mini-Mapa Leaflet do Bairro com Demarcação Vetorial GeoJSON (Nominatim) e Contorno Tracejado (dashArray: '6, 6')
async function initCepMiniMap(lat, lon, bairro, cidade) {
    const mapContainer = document.getElementById("cep-map");
    if (!mapContainer || typeof L === "undefined") return;

    const bairroNome = bairro || cidade || "Região";
    const cidadeNome = cidade || "Brasil";

    if (cepMapInstance) {
        cepMapInstance.remove();
        cepMapInstance = null;
    }

    // Zoom adaptativo para resoluções mobile 320px-425px (Spec v7.0 Requirement: Zoom 13/14)
    const isMobileScreen = window.innerWidth <= 425;
    const initialZoom = isMobileScreen ? 13 : 14;

    cepMapInstance = L.map("cep-map", {
        center: [lat, lon],
        zoom: initialZoom,
        dragging: true,
        scrollWheelZoom: false,
        zoomControl: true
    });

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    cepTileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 18
    }).addTo(cepMapInstance);

    const getPolygonStyle = (theme) => ({
        color: theme === 'light' ? '#121316' : '#FFFFFF',
        weight: 2,
        dashArray: '6, 6', // Contorno tracejado 6,6
        fillColor: theme === 'light' ? '#121316' : '#FFFFFF',
        fillOpacity: 0.15
    });

    // Busca do perímetro exato por GeoJSON via API Nominatim (Spec v8.0)
    let geoJsonData = null;
    if (bairro && cidade) {
        try {
            const queryUrl = 'https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=' + encodeURIComponent(`${bairro}, ${cidade}, Brasil`);
            const res = await fetch(queryUrl);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const itemComGeoJson = data.find(i => i.geojson && (i.geojson.type === "Polygon" || i.geojson.type === "MultiPolygon")) || data[0];
                    if (itemComGeoJson && itemComGeoJson.geojson) {
                        geoJsonData = itemComGeoJson.geojson;
                    }
                }
            }
        } catch (e) {
            console.warn("Consulta Nominatim GeoJSON não disponível, aplicando fallback:", e);
        }
    }

    if (geoJsonData) {
        cepPolygonInstance = L.geoJSON(geoJsonData, {
            style: getPolygonStyle(currentTheme)
        }).addTo(cepMapInstance);

        if (cepPolygonInstance.getBounds && cepPolygonInstance.getBounds().isValid()) {
            cepMapInstance.fitBounds(cepPolygonInstance.getBounds(), { padding: [20, 20] });
        }
    } else {
        // Fallback de retângulo rígido caso Nominatim não traga o polígono
        const boundsRectangle = [
            [lat - 0.008, lon - 0.012],
            [lat + 0.008, lon + 0.012]
        ];
        cepPolygonInstance = L.rectangle(boundsRectangle, getPolygonStyle(currentTheme)).addTo(cepMapInstance);
    }

    const customIcon = L.divIcon({
        className: 'leaflet-map-badge',
        html: `<span>📍 Bairro: ${bairroNome}</span>`,
        iconSize: [140, 26],
        iconAnchor: [70, 13]
    });

    L.marker([lat, lon], { icon: customIcon }).addTo(cepMapInstance);

    window.addEventListener('themeChanged', (e) => {
        if (cepMapInstance && cepTileLayerInstance) {
            const newTheme = e.detail.theme;
            cepMapInstance.removeLayer(cepTileLayerInstance);
            cepTileLayerInstance = L.tileLayer(getTileUrl(newTheme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                maxZoom: 18
            }).addTo(cepMapInstance);

            if (cepPolygonInstance && typeof cepPolygonInstance.setStyle === 'function') {
                cepPolygonInstance.setStyle(getPolygonStyle(newTheme));
            }
        }
    });
}

export default {
    url: "#busca-cep",
    label: "Busca por CEP",
    icone: SVG_ICONS.location,
    pagina: buscaCep
};
