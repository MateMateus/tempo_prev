async function buscaCep(app) {
    app.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h2>🔍 Carregando Busca por CEP...</h2>
        </div>
    `;
}

export default {
    url: '#busca-cep',
    label: 'Busca por CEP',
    icone: '📍',
    pagina: buscaCep
};
