import { SVG_ICONS } from "../components/icons.js";

/**
 * Inicializa os manipuladores de eventos para botões de acordeão expansíveis.
 * @param {string} buttonSelector - Seletor CSS dos botões de alternância (ex: '.regiao-card__btn-toggle').
 * @param {string} accordionIdPrefix - Prefixo do ID do elemento de acordeão (ex: 'accordion-' ou 'accordion-cap-').
 * @param {string} openClass - Classe CSS aplicada quando aberto (ex: 'regiao-card__accordion--open').
 */
export function initAccordionEvents(buttonSelector, accordionIdPrefix, openClass) {
    document.querySelectorAll(buttonSelector).forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.getAttribute('data-id');
            const accordion = document.getElementById(`${accordionIdPrefix}${itemId}`);
            
            if (accordion) {
                const isOpen = accordion.classList.contains(openClass);
                
                if (isOpen) {
                    accordion.classList.remove(openClass);
                    btn.innerHTML = `<span>Ver detalhes</span> ${SVG_ICONS.chevronDown}`;
                } else {
                    accordion.classList.add(openClass);
                    btn.innerHTML = `<span>Recolher</span> ${SVG_ICONS.chevronUp}`;
                }
            }
        });
    });
}
