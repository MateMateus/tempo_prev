function footer() {
    const footerElem = document.getElementById('footer');
    if (!footerElem) return;

    footerElem.innerHTML = `
        <div class="bem-footer">
            <div class="bem-footer__content">
                <p>Tempo Prev — Previsão do Tempo Brasil © 2026 • Mateus Braga (MateMateus)</p>
            </div>
        </div>
    `;
}

export default footer;
