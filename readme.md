# tempo_prev — Previsão do Tempo Brasil

Aplicação web SPA (Single Page Application) em Vanilla JS para consulta e monitoramento meteorológico no Brasil.

## Recursos Principais

- **Navegação SPA**: Roteamento por hash (`Router.js`) sem recarregamento de página.
- **Gerenciamento de Estado**: Sistema PubSub simples (`Store.js`) para controle de tema (Dark/Light) e localização.
- **Cache de Dados**: Cache temporário em memória e `localStorage` (TTL de 12h / 720 min) para evitar requisições repetidas.
- **Consulta por CEP**: Busca rápida de localização e clima via API ViaCEP.
- **Visualização Flexível**: Dashboard completo no desktop e visualização adaptada para telas menores.

## Tecnologias Utilizadas

- HTML5 & CSS3 (Vanilla CSS, CSS Variables)
- JavaScript ES6+ (ES Modules)
- APIs Públicas: [Open-Meteo](https://open-meteo.com/), [ViaCEP](https://viacep.com.br/)
- Mapa Interativo: [Leaflet.js](https://leafletjs.com/)

## Estrutura do Projeto

```
tempo_prev/
├── index.html
├── src/
│   ├── css/          # Estilos e variáveis CSS
│   ├── js/
│   │   ├── components/  # Componentes e páginas
│   │   ├── router/      # Roteador SPA
│   │   ├── store/       # Estado da aplicação
│   │   ├── utils/       # Helpers e utilitários
│   │   └── main.js      # Ponto de entrada
```

## Como Executar

Por utilizar ES Modules, a aplicação precisa ser executada através de um servidor local.

### Usando VS Code Live Server
1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Usando Terminal
```bash
# Node.js
npx serve .

# Ou Python 3
python -m http.server 8000
```
Acesse `http://localhost:8000` no navegador.

