# ⚡ tempo_prev — Previsão do Tempo Brasil (Vanilla JS SPA)

Aplicação Web **Single Page Application (SPA)** moderna, intuitiva e totalmente responsiva para previsão do tempo e monitoramento climático do Brasil.

O projeto utiliza a arquitetura base do `app_livros`, construído em **JavaScript Puro (Vanilla JS)** com **ES Modules**, sem frameworks pesados, aplicando metodologias avançadas de design tokens, suporte a **Dark/Light Mode**, e estratégia de **Cache com TTL (Time-To-Live) de 30 minutos**.

---

## 🎯 Destaques do Projeto

- **Roteamento SPA por Hash (`hashchange`)**: Navegação instantânea sem recarregamento da página.
- **Design Adaptativo (Desktop & Mobile)**:
  - **PC (Dashboard Multi-colunas)**: Visão consolidada com destaques climáticos, previsão para 7 dias, gráfico de chuva por horário, lista de capitais brasileiras e mapa nacional.
  - **Mobile (App Minimalista Vertical)**: Hero card minimalista com ilustração 3D, temperatura em destaque, métricas rápidas (vento, umidade, sol) e carrossel de rolagem horizontal da previsão por hora (*Hourly Forecast*).
- **Tema Claro / Escuro (Light/Dark Mode)**: Alternância dinâmica com persistência no `localStorage`.
- **Cache Inteligente com TTL de 30 Minutos**: Economia de banda e requisições, invalidando registros antigos ou em caso de mudança de dia.
- **Integração com APIs Públicas**:
  - [Open-Meteo API](https://open-meteo.com/): Dados meteorológicos detalhados em tempo real.
  - [ViaCEP API](https://viacep.com.br/): Busca de localização brasileira a partir do CEP.

---

## 📂 Estrutura do Repositório

```
tempo_prev/
├── index.html                           # Ponto de entrada único SPA
├── readme.md                            # Documentação do projeto
├── projeto_spec.json                    # Especificação arquitetural
└── src/
    ├── css/
    │   ├── variables.css                # Tokens de cores e variáveis CSS (Dark/Light)
    │   ├── microframework.css           # Grid, BEM Navbar, Drawer e utilitários
    │   ├── dashboard.css                # Visual do Dashboard PC e Layout Minimalista Mobile
    │   ├── cep.css                      # Estilos da consulta por CEP
    │   └── regioes.css                  # Estilos do grid de regiões de São Paulo
    ├── img/                             # Recursos visuais estáticos
    └── js/
        ├── main.js                      # Roteador principal, boot e listeners
        └── components/
            ├── navbar/
            │   └── navbar.js            # Menu hamburguer, busca rápida e chaveador de tema
            ├── footer/
            │   └── footer.js            # Rodapé informativo
            ├── rotas/
            │   └── rotas.js             # Mapeamento centralizado de telas
            ├── services/
            │   ├── api.js               # Service HTTP com fetch/async-await
            │   ├── storageStrategy.js   # Validação de validade (TTL 30 min)
            │   └── apiCache.js          # Controle de cache meteorológico
            └── paginas/
                ├── inicio.js            # Dashboard Principal
                ├── buscaCep.js          # Consulta por CEP + ViaCEP + Clima
                ├── spRegioes.js          # Visão das macrorregiões de SP
                └── sobre.js             # Informações sobre a aplicação
```

---

## 🛠️ Como Executar o Projeto

Por utilizar **ES Modules** nativos (`<script type="module">`), a aplicação deve ser servida através de um servidor HTTP local.

### Opção 1: Live Server (VS Code)
Clique com o botão direito no arquivo `index.html` → **Open with Live Server**.

### Opção 2: Servidor Node / Python via Terminal
```bash
# Com Node.js
npx serve tempo_prev

# Ou com Python
python -m http.server 8000
```
Em seguida, acesse `http://localhost:8000` no seu navegador.

---

## 🌿 Workflow de Branches no Git

O desenvolvimento segue o padrão **Git Feature Branch Workflow**:
1. `feature/estrutura-base-spa` — Estrutura base HTML/CSS, roteador, navbar e footer.
2. `feature/servico-cache-ttl` — Camada de serviços HTTP e cache com TTL.
3. `feature/dashboard-inicio` — Dashboard climático principal (Desktop + Mobile).
4. `feature/busca-cep` — Integração ViaCEP e busca por CEP.
5. `feature/regioes-sp` — Monitoramento das regiões de São Paulo.
