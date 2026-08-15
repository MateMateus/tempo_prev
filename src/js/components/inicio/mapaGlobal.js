import { SVG_ICONS } from "../icons.js";

const CAPITAIS_GLOBAIS = [
    { nome: "Brasília", pais: "BR", lat: -15.7801, lon: -47.9292, temp: "25°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Washington D.C.", pais: "US", lat: 38.9072, lon: -77.0369, temp: "22°", iconeSvg: SVG_ICONS.weatherCloudSun },
    { nome: "Londres", pais: "UK", lat: 51.5074, lon: -0.1278, temp: "16°", iconeSvg: SVG_ICONS.weatherRain },
    { nome: "Tóquio", pais: "JP", lat: 35.6762, lon: 139.6503, temp: "26°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Cairo", pais: "EG", lat: 30.0444, lon: 31.2357, temp: "34°", iconeSvg: SVG_ICONS.weatherSun },
    { nome: "Moscou", pais: "RU", lat: 55.7558, lon: 37.6173, temp: "18°", iconeSvg: SVG_ICONS.weatherSun }
];

let mapInstance = null;
let tileLayerInstance = null;
let onThemeChangedHandler = null;

export function cleanupGlobalMap() {
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
 * Inicialização do Mapa Vetorial Global Limpo, Leve e Rápido.
 */
export function initGlobalVectorMap() {
    const mapContainer = document.getElementById("mapa-brasil-leaf");
    if (!mapContainer || typeof L === "undefined") return;

    cleanupGlobalMap();

    mapInstance = L.map("mapa-brasil-leaf", {
        center: [25, 15],
        zoom: 2,
        worldCopyJump: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        zoomControl: true
    });

    mapInstance.zoomControl.setPosition('topright');

    const getTileUrl = (theme) => {
        return theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png';
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    tileLayerInstance = L.tileLayer(getTileUrl(currentTheme), {
        attribution: '&copy; CartoDB & OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 18,
        minZoom: 2
    }).addTo(mapInstance);

    onThemeChangedHandler = (e) => {
        if (mapInstance && tileLayerInstance) {
            mapInstance.removeLayer(tileLayerInstance);
            tileLayerInstance = L.tileLayer(getTileUrl(e.detail.theme), {
                attribution: '&copy; CartoDB & OpenStreetMap',
                subdomains: 'abcd',
                maxZoom: 18,
                minZoom: 2
            }).addTo(mapInstance);
        }
    };

    window.addEventListener('themeChanged', onThemeChangedHandler);

    // Marcadores das Capitais Globais
    CAPITAIS_GLOBAIS.forEach(m => {
        const isWashington = m.nome.includes("Washington");
        const customIcon = L.divIcon({
            className: 'leaflet-map-badge' + (isWashington ? ' leaflet-map-badge--washington' : ''),
            html: `<span>${m.nome} ${m.temp}</span>`,
            iconSize: isWashington ? [130, 26] : [110, 26],
            iconAnchor: isWashington ? [15, 13] : [55, 13]
        });

        L.marker([m.lat, m.lon], { icon: customIcon, zIndexOffset: 1000 }).addTo(mapInstance);
    });
}
