async function spRegioes(app) {
    app.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h2>🗺️ Carregando Regiões de SP...</h2>
        </div>
    `;
}

export default {
    url: '#sp-regioes',
    label: 'Regiões de SP',
    icone: '🗺️',
    pagina: spRegioes
};
