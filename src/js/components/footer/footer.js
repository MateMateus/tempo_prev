function footer() {
    const footerElem = document.getElementById('footer');
    if (!footerElem) return;

    footerElem.innerHTML = `
        <div class="bem-footer">
            <div class="bem-footer__content">
                <p>⚡ <strong>tempo_prev</strong> — Previsão do Tempo Brasil em Vanilla JS (SPA)</p>
                <p>Desenvolvido com Open-Meteo API & ViaCEP API • Cache com TTL de 30 minutos</p>
                <p>© ${new Date().getFullYear()} • Mateus Braga (MateMateus)</p>
            </div>
        </div>
    `;
}

export default footer;
