async function inicio(app) {
    app.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h2>⚡ Carregando Dashboard Principal do Clima...</h2>
        </div>
    `;
}

export default {
    url: '#inicio',
    label: 'Dashboard',
    icone: '🌤️',
    pagina: inicio
};
