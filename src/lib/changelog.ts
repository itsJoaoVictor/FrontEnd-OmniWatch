export interface ReleaseHighlight {
  title: string;
  description: string;
  tag?: string;
}

export interface AppRelease {
  /**
   * Identificador numérico crescente da atualização (1, 2, 3...).
   * Sempre que publicar uma nova versão, adicione um novo item com `id` maior que o anterior.
   * O sistema exibirá automaticamente todas as atualizações com `id > user.last_seen_release_id`.
   */
  id: number;
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: ReleaseHighlight[];
}

export const APP_RELEASES: AppRelease[] = [
  {
    id: 1,
    version: "v1.3.0",
    date: "Outubro 2026",
    title: "Nova Vitrine 'Para Você Descobrir' em Atores e Diretores",
    summary:
      "A página de pessoas agora sugere obras inéditas para você onde o artista realmente tem papel de destaque.",
    highlights: [
      {
        title: "Score de Destaque Personalizado (40 / 35 / 25)",
        description:
          "Novo algoritmo que combina 40% de Protagonismo no elenco/direção, 35% de Qualidade e Relevância da obra e 25% de Afinidade com as suas Personas.",
        tag: "Algoritmo",
      },
      {
        title: "Filtro Automático de Obras Já Assistidas",
        description:
          "Filmes e séries que você já concluiu, está assistindo ou abandonou dão lugar automaticamente a novas descobertas da carreira da pessoa.",
        tag: "Descoberta",
      },
      {
        title: "Alternância Rápida com 'Conhecido(a) por'",
        description:
          "Você pode alternar com um clique entre as sugestões personalizadas para você e os maiores sucessos clássicos da carreira.",
        tag: "Interface",
      },
    ],
  },
  {
    id: 2,
    version: "v1.4.0",
    date: "Outubro 2026",
    title: "Marcação Rápida de Temporadas Inteiras em Séries",
    summary:
      "Agora você pode marcar ou desmarcar uma temporada completa como assistida com apenas um clique, sem precisar abrir a lista de episódios.",
    highlights: [
      {
        title: "Botão 'Marcar temporada' Direto no Card",
        description:
          "Marque ou desmarque todos os episódios já lançados de uma temporada diretamente pelo cabeçalho da temporada na página da série.",
        tag: "Praticidade",
      },
      {
        title: "Barra de Progresso e Contador por Temporada",
        description:
          "Visualize rapidamente quantos episódios já foram assistidos em cada temporada (ex: 10/10 assistidos) com indicador de progresso visual.",
        tag: "Interface",
      },
      {
        title: "Preenchimento Inteligente de Temporadas Anteriores",
        description:
          "Ao marcar uma temporada mais avançada, o OmniWatch pergunta se você deseja marcar automaticamente todas as temporadas anteriores como assistidas.",
        tag: "Automação",
      },
    ],
  },
  {
    id: 3,
    version: "v1.5.0",
    date: "Outubro 2026",
    title: "Controle de Obras e Episódios Reassistidos & Boost no Match Score",
    summary:
      "Agora você pode registrar quantas vezes reassistiu seus filmes, séries, temporadas e episódios favoritos, com impacto direto nas suas recomendações.",
    highlights: [
      {
        title: "Marcar Filmes e Séries como Reassistidos",
        description:
          "Registre e ajuste o contador de revisões diretamente pelo menu da sua lista, com selo visual de 'Reassistido' nos cards e no ranking de estatísticas.",
        tag: "Rastreamento",
      },
      {
        title: "Reassistir por Episódio ou Temporada Completa",
        description:
          "Em séries de TV, marque episódios individuais ou temporadas inteiras como reassistidos. Ao reassistir todos os episódios lançados, a série toda é marcada como reassistida automaticamente.",
        tag: "Séries & Automação",
      },
      {
        title: "Peso Maior no Match Score e Recomendações",
        description:
          "Obras e episódios que você reassiste agora têm peso reforçado no seu perfil de gosto, nas Personas e no cálculo de Match Score com novas tags explicativas.",
        tag: "Algoritmo",
      },
    ],
  },
  {
    id: 4,
    version: "v1.5.1",
    date: "Outubro 2026",
    title: "Recuperação de Senha Direta & Segurança de Sessão",
    summary:
      "Novo fluxo de recuperação de senha rápida na tela de acesso, com validação de identidade e revogação automática de sessões antigas.",
    highlights: [
      {
        title: "Redefinição de Senha por E-mail + @Username",
        description:
          "Caso esqueça sua senha, agora é possível redefini-la diretamente em '/forgot-password' confirmando seu e-mail cadastrado e seu nome de usuário.",
        tag: "Conta",
      },
      {
        title: "Indicador de Força de Senha em Tempo Real",
        description:
          "Validação visual instantânea dos requisitos de segurança ao definir sua nova senha.",
        tag: "Interface",
      },
      {
        title: "Revogação Automática de Sessões Ativas",
        description:
          "Ao alterar sua senha, todos os tokens de sessão anteriores são invalidados e bloqueios temporários de tentativas de login são zerados.",
        tag: "Segurança",
      },
    ],
  },
  {
    id: 5,
    version: "v1.6.0",
    date: "Outubro 2026",
    title: "Universos Compartilhados: Sugestões Inteligentes e Controle de Franquias",
    summary:
      "Acompanhe universos multimídia completos (MCU, Invocação do Mal, Demon Slayer, etc.) com catálogo cronológico, controle granular de obras ignoradas e reativação inteligente de sugestões.",
    highlights: [
      {
        title: "Catálogo Cronológico Unificado (Filmes + Séries)",
        description:
          "Agrupamento de filmes, séries, especiais e sagas conectadas via Wikidata e TMDB, com métricas de progresso duplo (progresso pessoal vs catálogo canônico).",
        tag: "Universos",
      },
      {
        title: "Seleção Granular & Ocultação de Obras Ignoradas",
        description:
          "Escolha quais obras incluir ao seguir com ações rápidas ('Desmarcar Filmes', 'Desmarcar Recaps'). Obras indesejadas podem ser ignoradas e ocultadas da grade com o botão de olho.",
        tag: "Personalização",
      },
      {
        title: "Reativação Inteligente por Afinidade Aumentada",
        description:
          "Ao dispensar um universo, o sistema não incomoda se você apenas mantiver a mesma coleção de filmes em dia. Mas caso você comece a assistir séries ou novas sagas conectadas, a sugestão é reativada de forma contextual.",
        tag: "Inteligência",
      },
      {
        title: "Painel de Sugestões Dispensadas",
        description:
          "Acesse a seção de franquias dispensadas na aba Universos a qualquer momento para revisitar o catálogo ou restaurar qualquer sugestão com 1 clique.",
        tag: "Praticidade",
      },
      {
        title: "Fallback Inteligente de Títulos Internacionais",
        description:
          "Obras sem tradução para o português agora priorizam automaticamente o título internacional em inglês, evitando caracteres originais em japonês nos cards.",
        tag: "Qualidade",
      },
    ],
  },
  {
    id: 6,
    version: "v1.7.0",
    date: "Outubro 2026",
    title: "Estatísticas 2.0: Insights Wrapped, Central de Rankings de Talentos e Ultra Performance",
    summary:
      "A página de estatísticas foi totalmente reformulada: novo painel OmniWatch Highlights estilo Spotify-Wrapped, rankings paginados de elenco e diretores com links diretos para os artistas, e arquitetura de hiper-escala com respostas sub-milissegundo.",
    highlights: [
      {
        title: "OmniWatch Highlights (Insights Pessoais de Consumo)",
        description:
          "Descubra sua 'Viagem no Tempo' (equivalência de horas em voltas ao mundo e dias completos de tela), seu 'DNA de Consumo' (Serial Binger vs Cinéfilo Devoto), o 'Rosto do Universo' com seu artista favorito e seu badge de consistência.",
        tag: "Insights",
      },
      {
        title: "Central de Rankings Paginada para Atores e Diretores",
        description:
          "Navegue por todo o elenco e diretores das obras assistidas com paginação nativa (10 por página), busca em tempo real e ordenações por Mais Obras, Mais Tempo, Melhores Notas e Ordem Alfabética.",
        tag: "Rankings",
      },
      {
        title: "Atores e Diretores Clicáveis com Acesso ao Perfil",
        description:
          "Toque em qualquer ator, atriz ou diretor na tabela ou nos cards para abrir diretamente a página completa do artista (/person/[id]) com fotos, biografia e filmografia.",
        tag: "Navegação",
      },
      {
        title: "Hero Card de Tempo Assistido & Layout Mobile-First",
        description:
          "Novo card principal com barra de proporção bicolor (Séries vs Filmes), rótulo central no Donut Chart com o Top Gênero e grid 2x2 otimizado para navegação rápida no celular.",
        tag: "Design",
      },
      {
        title: "Hiper-Escala e Performance Sub-Milissegundo (SWR)",
        description:
          "Cálculo analítico via Pushdown SQL no PostgreSQL, contadores desnormalizados e cache inteligente Stale-While-Revalidate que entrega respostas instantâneas.",
        tag: "Performance",
      },
    ],
  },
];

export const LATEST_RELEASE_ID = APP_RELEASES.reduce(
  (max, item) => (item.id > max ? item.id : max),
  0
);
