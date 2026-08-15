import buscarServicos from "../components/services/apiCache.js";

// Obtém coordenadas GPS do navegador

export async function obterLocalizacaoGPS() {
    if (!("geolocation" in navigator)) {
        throw new Error("Geolocalização não é suportada por este navegador.");
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // Tenta reverse geocoding via Open-Meteo / BigDataCloud
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
                    if (res.ok) {
                        const data = await res.json();
                        const cidade = data.city || data.locality || data.principalSubdivision || "Sua Localização";
                        resolve({ lat, lon, cidade: `${cidade}, Brasil` });
                        return;
                    }
                } catch (e) {
                    // Fallback para coordenadas numéricas
                }

                resolve({ lat, lon, cidade: `${lat.toFixed(2)}, ${lon.toFixed(2)}` });
            },
            (error) => {
                let msg = "Não foi possível obter a localização.";
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Permissão de localização negada pelo usuário.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = "Informação de localização indisponível no dispositivo.";
                } else if (error.code === error.TIMEOUT) {
                    msg = "Tempo limite para obter localização esgotado.";
                }
                reject(new Error(msg));
            },
            { timeout: 8000, enableHighAccuracy: false }
        );
    }
);
}
