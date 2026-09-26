<h1 align="center">
  🎬 OmniWatch - Frontend
</h1>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react&logoColor=black">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white">
  <img alt="Zustand" src="https://img.shields.io/badge/State-Zustand-orange.svg">
</p>

<p align="center">
  O <strong>Frontend do OmniWatch</strong> é a interface moderna e responsiva da plataforma de rastreamento e recomendação de filmes e séries, consumindo diretamente a <a href="https://github.com/itsJoaoVictor/Backend-OmniWatch">API do OmniWatch</a>.
</p>

## 🚀 Visão Geral

Construído com as mais recentes tecnologias do ecossistema React, o frontend do OmniWatch proporciona uma experiência de usuário (UX) fluida, rápida e imersiva. Ele permite que os usuários explorem o catálogo, gerenciem suas listas, vejam estatísticas de visualização e recebam recomendações personalizadas impulsionadas pelo motor de Machine Learning do backend.

## 🛠️ Tecnologias Utilizadas

A stack de front-end foca em performance, acessibilidade e design de ponta:

- **Framework Core:** [Next.js 16](https://nextjs.org/) (utilizando o *App Router* e *Server Components* para otimização de SEO e tempo de carregamento).
- **Biblioteca UI:** React 19.
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/) com suporte a `next-themes` para Dark/Light mode.
- **Componentes Acessíveis:** [shadcn/ui](https://ui.shadcn.com/), construído sobre Radix/Base UI e `lucide-react` para ícones elegantes.
- **Gerenciamento de Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (leve, rápido e escalável).
- **Formulários e Validação:** `react-hook-form` + `zod` para validação de dados robusta no lado do cliente.
- **Gráficos e Visualização de Dados:** `recharts` para exibição de estatísticas interativas do usuário.
- **Carrosséis:** `embla-carousel-react` para listas fluidas e responsivas de filmes e séries.
- **Integração de API:** `axios` para consumo da API REST e middlewares do Next.js para proteção de rotas.

## ✨ Funcionalidades Principais

- **Descoberta de Mídias:** Explore filmes e séries "Em Alta", navegue por categorias, gêneros e busque diretamente por títulos, atores ou diretores.
- **Dashboard de Recomendações:** Uma página inicial dinâmica alimentada pelo motor de IA do backend, sugerindo conteúdos baseados no seu histórico e avaliações.
- **Gerenciamento de Listas (Tracking):** Adicione itens aos seus "Favoritos", marque como "Assistido" ou adicione à lista de "Quero Assistir".
- **Estatísticas do Usuário:** Gráficos interativos mostrando os gêneros mais assistidos, tempo total gasto e histórico.
- **Design Responsivo e Temas:** UI perfeitamente adaptada para dispositivos móveis, tablets e desktops, com suporte nativo a tema Escuro/Claro.

## 📁 Estrutura do Projeto

O projeto adota uma arquitetura modular baseada nos padrões do Next.js App Router:

```text
src/
├── app/                  # Rotas do App Router (Pages, Layouts, Loading, Error)
├── components/           # Componentes reutilizáveis (UI base da shadcn, cards, modais)
├── hooks/                # Custom hooks (lógica de estado local ou de ciclo de vida)
├── lib/                  # Utilitários globais (ex: formatadores, merge do Tailwind)
├── middleware.ts         # Middleware do Next.js (proteção de rotas privadas e verificação JWT)
├── services/             # Instâncias do Axios e consumo dos endpoints do backend
├── store/                # Stores globais do Zustand (ex: autenticação, tema)
└── types/                # Tipagens do TypeScript
```

## ⚙️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** instalado (v18+)
- **NPM**, **Yarn** ou **PNPM**
- [Backend do OmniWatch](https://github.com/itsJoaoVictor/Backend-OmniWatch) rodando localmente.

### 2. Instalação

Clone este repositório e instale as dependências:

```bash
git clone https://github.com/itsJoaoVictor/FrontEnd-OmniWatch.git
cd FrontEnd-OmniWatch
npm install
```

### 3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (com base no `.env.example`) para apontar para a API do backend:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 4. Executando o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O servidor de desenvolvimento irá atualizar a página automaticamente ao salvar arquivos.

## 🤝 Autor

**João Victor**  
[GitHub](https://github.com/itsJoaoVictor)

---
*Projeto desenvolvido para fins de portfólio e aprimoramento de habilidades no ecossistema moderno de front-end com React e Next.js.*
