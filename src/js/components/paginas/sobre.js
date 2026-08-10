async function sobre(app) {
    app.innerHTML = `
        <div class="cep-container">
            <div class="cep-card">
                <h1 class="cep-title">ℹ️ Sobre o tempo_prev</h1>
                <p class="cep-subtitle">Aplicação Web Single Page Application (SPA) para Previsão do Tempo e Monitoramento Climático do Brasil.</p>
                
                <div class="address-info-grid">
                    <div class="address-box">
                        <div class="address-box__label">Arquitetura Base</div>
                        <div class="address-box__value">Modular Vanilla JS (app_livros)</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">Estratégia de Cache</div>
                        <div class="address-box__value">TTL de 30 Minutos (LocalStorage)</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">APIs Integradas</div>
                        <div class="address-box__value">Open-Meteo & ViaCEP</div>
                    </div>
                    <div class="address-box">
                        <div class="address-box__label">Suporte de Temas</div>
                        <div class="address-box__value">Dark / Light Mode</div>
                    </div>
                </div>

                <div style="line-height: 1.8; color: var(--text-secondary); font-size: 0.95rem;">
                    <p>O <strong>tempo_prev</strong> foi construído utilizando JavaScript moderno (ES Modules), sem a dependência de frameworks pesados. Ele aplica os conceitos de:</p>
                    <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                        <li><strong>Roteamento base-hash:</strong> Transição fluida de telas sem reload de página.</li>
                        <li><strong>Design Adaptativo:</strong> Dashboard multi-colunas para PC e fluxo minimalista para telas mobile.</li>
                        <li><strong>Design System & Tokens:</strong> Manipulação dinâmica de CSS Variables com Metodologia BEM.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

export default {
    url: '#sobre',
    label: 'Sobre',
    icone: 'ℹ️',
    pagina: sobre
};
