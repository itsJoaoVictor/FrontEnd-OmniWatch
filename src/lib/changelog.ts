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
];

export const LATEST_RELEASE_ID = APP_RELEASES.reduce(
  (max, item) => (item.id > max ? item.id : max),
  0
);
