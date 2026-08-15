import { SVG_ICONS } from "../components/icons.js";

// Traduz código de clima da Open-Meteo

export function traduzirClimaWmo(codigo) {
    if (codigo === 0) {
        return {
            texto: "Ensolarado e Limpo",
            iconeSvg: SVG_ICONS.weatherSun,
            frase: "Dia ensolarado com céu limpo."
        };
    }
    if ([1, 2, 3].includes(codigo)) {
        return {
            texto: "Parcialmente Nublado",
            iconeSvg: SVG_ICONS.weatherCloudSun,
            frase: "Sol com algumas nuvens."
        };
    }
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) {
        return {
            texto: "Chuva Moderada",
            iconeSvg: SVG_ICONS.weatherRain,
            frase: "Expectativa de chuva durante o dia."
        };
    }
    return {
        texto: "Nublado",
        iconeSvg: SVG_ICONS.weatherCloudSun,
        frase: "Céu encoberto por nuvens."
    };
}

/**
 * Retorna o ícone SVG correspondente ao código meteorológico WMO.
 * @param {number} codigo - Código WMO retornado pela API.
 * @returns {string} String do elemento SVG.
 */
export function obterIconeClimaSvg(codigo) {
    return traduzirClimaWmo(codigo).iconeSvg;
}

/**
 * Retorna o nome do dia da semana formatado a partir de uma data ISO.
 * @param {string} dataIso - Data em formato YYYY-MM-DD.
 * @param {number} indice - Índice relativo (0 = Hoje, 1 = Amanhã).
 * @returns {string}
 */
export function obterDiaSemana(dataIso, indice) {
    if (indice === 0) return "Hoje";
    if (indice === 1) return "Amanhã";
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const d = new Date(dataIso + "T00:00:00");
    return dias[d.getDay()];
}
