# Painel Biscoitos de Natal - Escola StartUp

Este projeto é um painel de organização para a startup de biscoitos de natal, desenvolvido para auxiliar no gerenciamento de tarefas e cálculo de custos.

## Estrutura do Projeto

O projeto foi refatorado para uma estrutura modular:

- **index.html**: Estrutura principal da página.
- **css/**: Contém os arquivos de estilo.
  - `styles.css`: Estilos globais e específicos dos componentes.
- **js/**: Contém a lógica da aplicação dividida em módulos.
  - `app.js`: Ponto de entrada da aplicação e configuração de eventos.
  - `data.js`: Gerenciamento de dados e persistência (LocalStorage).
  - `ui.js`: Funções de renderização da interface.
  - `utils.js`: Funções utilitárias (diálogos, temas, etc.).

## Funcionalidades

1.  **Cronograma**:
    - Gerenciamento de equipe (adicionar/remover membros).
    - Lista de tarefas dividida por fases do projeto.
    - Adição, edição e exclusão de tarefas.
    - Acompanhamento do progresso geral.

2.  **Calculadora de Custos**:
    - Definição de meta de produção.
    - Cadastro de ingredientes e custos extras.
    - Cálculo automático de custo unitário, preço de venda e lucro.
    - Gráfico de distribuição de custos vs. lucro.

## Como Rodar

Basta abrir o arquivo `index.html` em um navegador moderno. O projeto utiliza módulos ES6, então para algumas funcionalidades (como importação de módulos) pode ser necessário rodar através de um servidor local (ex: Live Server do VS Code) para evitar erros de CORS, embora a estrutura atual deva funcionar localmente na maioria dos navegadores modernos para desenvolvimento simples.

## Tecnologias

- HTML5
- CSS3 (Variáveis CSS, Flexbox, Grid)
- JavaScript (ES6 Modules)
- Material Web Components (Google)
- Chart.js (Gráficos)

## Deploy no Netlify

Este projeto já está configurado para deploy no Netlify.

1.  Conecte seu repositório Git ao Netlify.
2.  Nas configurações de build:
    - **Build command**: (deixe em branco)
    - **Publish directory**: `.` (ou deixe em branco se o Netlify detectar automaticamente)
3.  O arquivo `netlify.toml` incluído já configura os cabeçalhos de segurança e cache apropriados.
