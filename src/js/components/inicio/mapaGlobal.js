import { SVG_ICONS } from "../icons.js";

const CAPITAIS_GLOBAIS = [
    { nome: "Brasília", pais: "BR", lat: -15.7801, lon: -47.9292, temp: "25°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Washington D.C.", pais: "US", lat: 38.9072, lon: -77.0369, temp: "22°", iconeSvg: SVG_ICONS.weatherCloudSun },
    { nome: "Londres", pais: "UK", lat: 51.5074, lon: -0.1278, temp: "16°", iconeSvg: SVG_ICONS.weatherRain },
    { nome: "Tóquio", pais: "JP", lat: 35.6762, lon: 139.6503, temp: "26°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Cairo", pais: "EG", lat: 30.0444, lon: 31.2357, temp: "34°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Sydney", pais: "AU", lat: -33.8688, lon: 151.2093, temp: "19°", iconeSvg: SVG_ICONS.weatherCloudSun }
];

let mapInstance = null;
let tileLayerInstance = null;
let tempTileLayer = null;
let rainTileLayer = null;
let onThemeChangedHandler = null;

function cleanupGlobalMap() {
    if (onThemeChangedHandler) {
        window.removeEventListener('themeChanged', onThemeChangedHandler);
        onThemeChangedHandler = null;
    }
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
}

/**
 * Inicialização do Mapa Leaflet com Camadas Térmicas e de Chuva Globais.
 */
export function initGlobalVectorMap() {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    cleanupGlobalMap();

    const bounds = [[-85, -180], [85, 180]];

    mapInstance = L.map("mapa-brasil-leaf", {
        center: [20, 0],
        zoom: 2,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        zoomControl: true
    });

    mapInstance.zoomControl.setPosition('topright');

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    tileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 8,
        minZoom: 2,
        noWrap: true,
        bounds: bounds
    }).addTo(mapInstance);

    onThemeChangedHandler = (e) => {
        if (mapInstance && tileLayerInstance) {
            mapInstance.removeLayer(tileLayerInstance);
            tileLayerInstance = L.tileLayer(getTileUrl(e.detail.theme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                maxZoom: 8,
                minZoom: 2,
                noWrap: true,
                bounds: bounds
            }).addTo(mapInstance);
        }
    };

    window.addEventListener('themeChanged', onThemeChangedHandler);

    if (!tempTileLayer) {
        tempTileLayer = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', {
            opacity: 0.65,
            zIndex: 100,
            maxZoom: 8,
            noWrap: true,
            bounds: bounds
        });
    }

    if (!rainTileLayer) {
        rainTileLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=c8d45df9e0d1d6447d6d53ef69eb6861', {
            opacity: 0.65,
            zIndex: 100,
            maxZoom: 8,
            noWrap: true,
            bounds: bounds
        });
    }

    const zoomContainer = mapInstance.zoomControl.getContainer();
    if (zoomContainer) {
        // 1. Botão Térmico Real (Temperatura)
        const thermalBtn = document.createElement('button');
        thermalBtn.className = 'map-btn-control-circular' + (tempTileLayer && mapInstance.hasLayer(tempTileLayer) ? ' map-btn-control-circular--active' : '');
        thermalBtn.title = 'Alternar Gradiente Térmico de Temperatura';
        thermalBtn.innerHTML = SVG_ICONS.flame;

        thermalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!mapInstance || !tempTileLayer) return;

            if (mapInstance.hasLayer(tempTileLayer)) {
                mapInstance.removeLayer(tempTileLayer);
                thermalBtn.classList.remove('map-btn-control-circular--active');
            } else {
                mapInstance.addLayer(tempTileLayer);
                thermalBtn.classList.add('map-btn-control-circular--active');
            }
        });

        // 2. Botão de Radar de Precipitação Real (Chuva)
        const rainBtn = document.createElement('button');
        rainBtn.className = 'map-btn-control-circular' + (rainTileLayer && mapInstance.hasLayer(rainTileLayer) ? ' map-btn-control-circular--active' : '');
        rainBtn.title = 'Alternar Radar de Precipitação de Chuva';
        rainBtn.innerHTML = SVG_ICONS.rain;

        rainBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!mapInstance || !rainTileLayer) return;

            if (mapInstance.hasLayer(rainTileLayer)) {
                mapInstance.removeLayer(rainTileLayer);
                rainBtn.classList.remove('map-btn-control-circular--active');
            } else {
                mapInstance.addLayer(rainTileLayer);
                rainBtn.classList.add('map-btn-control-circular--active');
            }
        });

        zoomContainer.appendChild(thermalBtn);
        zoomContainer.appendChild(rainBtn);
    }

    // Marcadores das Capitais Globais
    CAPITAIS_GLOBAIS.forEach(m => {
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge',
            html: `<span>${m.nome} ${m.temp}</span>`,
            iconSize: [110, 26],
            iconAnchor: [55, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon }).addTo(mapInstance);
    });
}
