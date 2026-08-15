import { SVG_ICONS } from "../components/icons.js";

// Handler para acordeões expansíveis

export function initAccordionEvents(buttonSelector, accordionIdPrefix, openClass) {
    document.querySelectorAll(buttonSelector).forEach(btn => {
        const itemId = btn.getAttribute('data-id');
        const accordion = document.getElementById(`${accordionIdPrefix}${itemId}`);

        if (accordion) {
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', `${accordionIdPrefix}${itemId}`);
        }

        btn.addEventListener('click', () => {
            if (accordion) {
                const isOpen = accordion.classList.contains(openClass);
                
                if (isOpen) {
                    accordion.classList.remove(openClass);
                    btn.setAttribute('aria-expanded', 'false');
                    btn.innerHTML = `<span>Ver detalhes</span> ${SVG_ICONS.chevronDown}`;
                } else {
                    accordion.classList.add(openClass);
                    btn.setAttribute('aria-expanded', 'true');
                    btn.innerHTML = `<span>Recolher</span> ${SVG_ICONS.chevronUp}`;
                }
            }
        });
    });
}
