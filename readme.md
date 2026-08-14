# ⚡ tempo_prev — Previsão do Tempo Brasil (Vanilla JS SPA)

Aplicação Web **Single Page Application (SPA)** de alta performance, totalmente intuitiva e responsiva, projetada para monitoramento climático em tempo real no Brasil e no mundo.

O **tempo_prev** foi desenvolvido com **JavaScript Puro (Vanilla JS)** e **ES Modules**, utilizando uma arquitetura orientada a componentes, sem a necessidade de frameworks pesados (Zero Dependencies). O projeto combina design moderno com suporte a **Dark/Light Mode**, gerenciamento de estado reativo, roteamento limpo com hooks de ciclo de vida, sanitização contra XSS e estratégia de **Cache Inteligente com TTL de 15 minutos**.

---

## 🎯 Destaques e Diferenciais da Aplicação

- **Roteamento SPA Nátivo com Hooks de Ciclo de Vida (`Router.js`)**:
  - Navegação instantânea via *hash* (`hashchange`) sem recarregamento da página.
  - Lifecycle hooks (`mount` e `unmount`) para controle de memória, destruição de instâncias de mapas Leaflet e prevenção de vazamento de ouvintes DOM.
  - Suporte a slugs amigáveis em URLs (ex: `#clima/sao-paulo` ou `#clima/rio-de-janeiro`).
- **Gerenciamento de Estado Reativo & PubSub (`Store.js`)**:
  - Padrão Publisher/Subscriber centralizado em JS nativo.
  - Reatividade para troca de temas, atualização da localização global e notificação de componentes em tempo real.
- **Design Adaptativo de Alta Fidelidade (Desktop & Mobile)**:
  - **Desktop (Dashboard Multi-colunas)**: Visualização consolidada com métricas completas do clima, grade semanal interativa de 7 dias, gráfico de precipitação por horário (24h), lista de capitais nacionais e mapa interativo global.
  - **Mobile (App Minimalista Vertical)**: Visual hero focado com temperatura em destaque, métricas rápidas (sensação, pressão, umidade, vento, nascer/pôr do sol), carrossel horizontal de previsão por hora (*Hourly Forecast*) e carrossel de 7 dias com painel expansível de detalhes.
- **Cache Inteligente de Dupla Camada (TTL de 15 Minutos)**:
  - Cache em memória RAM (`memoriaTemporaria`) com fallback transparente para `localStorage` (`memoriaPermanente`).
  - Invalidação automática ao ultrapassar 15 minutos ou no evento de mudança de data (*dateStr*).
  - Tratamento defensivo contra `QuotaExceededError` e navegação privada.
- **Otimização de Carregamento LCP & Defensive Performance**:
  - Carregamento postergado do mapa Leaflet via `requestIdleCallback` para garantir LCP (*Largest Contentful Paint*) instantâneo nos cards principais.
  - *Performance Guard* defensivo contra exceções do console e temporizadores de terceiros.
- **Segurança contra Injeção de Código (XSS)**:
  - Utilitário de sanitização (`escapeHtml`) para garantir a injeção segura de dados externos no DOM.
- **Busca Rápida com Autocomplete Inteligente**:
  - Campo de pesquisa com efeito *debounce* no cabeçalho e menu dedicado no mobile, com sugestões de cidades brasileiras em tempo real.
- **Integração com APIs Públicas Nacionais e Internacionais**:
  - [Open-Meteo API](https://open-meteo.com/): Previsões meteorológicas e geocodificação global.
  - [ViaCEP API](https://viacep.com.br/): Busca de localização e clima a partir de CEPs brasileiros.
  - [BigDataCloud API](https://www.bigdatacloud.com/): Geolocalização GPS em 1 clique.
  - [Leaflet.js + CartoDB Tiles](https://leafletjs.com/): Mapas vetoriais interativos adaptáveis ao tema (Dark/Light).

---

## 🛠️ Tecnologias Utilizadas

- **Linguagens**: HTML5 Semântico, CSS3 Moderno (Vanilla CSS com Variáveis CSS / Design Tokens), JavaScript ES6+ (ES Modules).
- **Arquitetura**: SPA (Single Page Application), PubSub Pattern, BEM (Block Element Modifier) no CSS.
- **Bibliotecas Externas**: [Leaflet.js 1.9.4](https://leafletjs.com/) (Mapas interativos).
- **Tipografia**: Google Fonts (*Inter*, *Plus Jakarta Sans*, *Sora*).

---

## 📂 Estrutura do Repositório

```
tempo_prev/
├── index.html                           # Ponto de entrada único da SPA
├── readme.md                            # Documentação do projeto
├── .gitignore                           # Regras de exclusão do repositório Git
└── src/
    ├── css/
    │   ├── variables.css                # Design tokens, cores HSL e variáveis CSS (Dark/Light)
    │   ├── microframework.css           # Grid, BEM Navbar, Off-Canvas Drawer e utilitários
    │   ├── dashboard.css                # Layout do Dashboard Desktop e App Minimalista Mobile
    │   ├── cep.css                      # Estilos da consulta por CEP
    │   ├── regioes.css                  # Estilos do grid de regiões de São Paulo
    │   └── capitais.css                 # Estilos do monitoramento de capitais brasileiras
    ├── img/                             # Recursos visuais estáticos
    └── js/
        ├── main.js                      # Boot global da aplicação, Performance Guard e Router init
        ├── router/
        │   └── Router.js                # Roteador SPA com Hooks (mount/unmount) e fallback 404
        ├── store/
        │   └── Store.js                 # Gerenciador de estado centralizado & Barramento de Eventos (PubSub)
        ├── utils/
        │   ├── sanitizer.js             # Utilitário de sanitização XSS (escapeHtml)
        │   ├── performance.js           # Guard defensivo de performance e LCP
        │   ├── logger.js                # Logger visual e formatado para DevTools (API/Cache/SPA)
        │   ├── weatherUtils.js          # Ícones SVG e utilitários de clima
        │   ├── uiHelpers.js             # Skeleton loaders e gerador de slugs de cidades
        │   ├── geolocation.js           # Utilitário de geolocalização GPS nativa
        │   └── accordion.js             # Utilitário de acordeão para cards expansíveis
        └── components/
            ├── icons.js                 # Biblioteca centralizada de ícones SVG
            ├── navbar/
            │   └── navbar.js            # Cabeçalho BEM, busca com autocomplete e chaveador de tema
            ├── footer/
            │   └── footer.js            # Rodapé informativo
            ├── rotas/
            │   └── rotas.js             # Mapeamento centralizado de telas da SPA
            ├── inicio/
            │   └── mapaGlobal.js        # Módulo de inicialização e destruição do mapa Leaflet
            ├── services/
            │   ├── api.js               # Cliente HTTP com fetch/async-await
            │   ├── storageStrategy.js   # Estratégia de armazenamento (RAM / LocalStorage com TTL)
            │   └── apiCache.js          # Módulo de cache meteorológico com logs
            └── paginas/
                ├── inicio.js            # Dashboard Principal (Desktop + Mobile View)
                ├── buscaCep.js          # Consulta por CEP + Integração ViaCEP + Clima
                ├── spRegioes.js          # Monitoramento das macrorregiões de São Paulo
                ├── capitais.js          # Clima nas 8 principais capitais brasileiras (Batch Fetching)
                └── sobre.js             # Arquitetura e detalhes técnicos do projeto
```

---

## ⚡ Como Executar o Projeto

Por utilizar **ES Modules** nativos do navegador (`<script type="module">`), o projeto deve ser servido através de um servidor HTTP local.

### Opção 1: VS Code Live Server
1. Instale a extensão **Live Server** no VS Code.
2. Clique com o botão direito no arquivo `index.html` → **Open with Live Server**.

### Opção 2: Servidor Node.js / Python no Terminal
```bash
# Servindo com Node.js (npx serve)
npx serve .

# Ou com Python 3
python -m http.server 8000
```
Em seguida, acesse `http://localhost:8000` no seu navegador.

---

## 📱 Funcionalidades por Tela

1. **Dashboard Principal (`#inicio`)**:
   - Previsão detalhada para a localização selecionada ou cidade buscada.
   - Métricas completas: Sensação térmica, Umidade, Vento, Pressão, Nascer/Pôr do sol.
   - Carrossel de previsão por hora (24h) e carrossel de 7 dias com detalhes interativos.
   - Gráfico dinâmico de chance de chuva para as próximas 24 horas.
   - Mapa vetorial com marcas de capitais globais e suporte a camadas térmicas/radar.
2. **Consulta por CEP (`#busca-cep`)**:
   - Digitação e máscara dinâmica de CEP (`00000-000`).
   - Resolução automática do endereço via API ViaCEP e clima imediato do município localizado.
3. **Regiões de SP (`#sp-regioes`)**:
   - Monitoramento simultâneo das macrorregiões da capital paulista (Centro, Zona Norte, Zona Sul, Zona Leste, Zona Oeste).
4. **Capitais do Brasil (`#capitais`)**:
   - Visão em grade com as 8 principais metrópoles nacionais, carregadas em lote (*Batch Fetching*) para otimização de requisições HTTP.
   - Accordion expansível para métricas detalhadas de cada capital.
5. **Sobre o Projeto (`#sobre`)**:
   - Documentação viva da arquitetura, padrões utilizados e stack tecnológica.

---

## 🌿 Workflow de Desenvolvimento e Commits

O projeto adota boas práticas de commits semânticos (**Conventional Commits**):
- `feat`: Adição de novas funcionalidades.
- `fix`: Correção de bugs ou ajustes de visual.
- `refactor`: Mudanças estruturais no código sem alterar comportamento externo.
- `perf`: Otimizações de performance e tempo de resposta.
- `style`: Atualizações de tema, cores, responsividade e layout.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de demonstração prática de arquitetura em JavaScript Puro (Vanilla JS). Sinta-se à vontade para utilizar e aprimorar.
