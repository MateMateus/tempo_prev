import { SVG_ICONS } from "../icons.js";

async function sobre(app) {
    app.innerHTML = `
        <div class="cep-container">
            <div class="cep-card">
                <h1 class="cep-title">${SVG_ICONS.info} Sobre o Tempo Prev</h1>
                <p class="cep-subtitle">Aplicação Single Page Application (SPA) de previsão do tempo desenvolvida em JavaScript puro (Vanilla JS), HTML5 e CSS3 modular.</p>

                <div style="text-align: left; line-height: 1.6; color: var(--text-secondary); display: flex; flex-direction: column; gap: 1rem;">
                    <div style="background-color: var(--bg-card-hover); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">${SVG_ICONS.dashboard} Arquitetura & Tecnologias</h3>
                        <ul style="padding-left: 1.25rem;">
                            <li><strong>Vanilla JS (ES Modules)</strong>: Sem frameworks externos (React, Vue, Angular).</li>
                            <li><strong>Navegação SPA</strong>: Roteamento baseado no evento hashchange.</li>
                            <li><strong>Open-Meteo & ViaCEP APIs</strong>: Integração assíncrona com consumo resiliente via apiCache.</li>
                            <li><strong>Leaflet.js</strong>: Renderização vetorial de mapas meteorológicos globais.</li>
                        </ul>
                    </div>

                    <div style="background-color: var(--bg-card-hover); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">${SVG_ICONS.info} Desenvolvedor</h3>
                        <p>Desenvolvido por <strong>Mateus Braga (MateMateus)</strong> • © 2026</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export default {
    url: "#sobre",
    label: "Sobre",
    icone: SVG_ICONS.info,
    mount: sobre,
    unmount: () => {},
    pagina: sobre,
    cleanup: () => {}
};
