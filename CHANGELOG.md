# Changelog - OmniWatch Frontend

Todas as atualizações notáveis da interface estão documentadas neste arquivo.

---

## [v1.7.0] - Outubro 2026

### 🌟 Estatísticas 2.0: Insights Wrapped, Central de Rankings de Talentos e Ultra Performance

#### ✨ Novidades & Destaques:
* **OmniWatch Highlights (Estilo Spotify-Wrapped)**:
  * **Viagem no Tempo**: Conversão do tempo total de tela em voltas ao mundo de avião comercial e dias inteiros consumidos.
  * **DNA de Consumo**: Medição do perfil dominante entre séries (*Serial Binger*) e filmes (*Cinéfilo Devoto*).
  * **Rosto do Universo**: Card interativo com o artista mais frequente na sua biblioteca com link direto para o perfil.
  * **Finalizador Implacável**: Badge com a taxa de conclusão de obras da lista pessoal.

* **Central de Rankings de Atores e Diretores Paginada**:
  * Paginação nativa de 10 em 10 itens com suporte a ordenações múltiplas (Mais Obras, Mais Tempo, Melhor Avaliados e A-Z) e busca com debounce.
  * Linhas da tabela no Desktop e cards no Mobile 100% clicáveis (`cursor-pointer`) abrindo o perfil do artista (`/person/[id]`).

* **Hero Card & Design Mobile-First**:
  * Hero Card com barra bicolor de proporção (Séries vs Filmes).
  * Grid 2x2 compacto no mobile, rótulo central no Donut Chart e fade gradiente nos filtros.

* **Performance & SWR**:
  * Cache em memória e suporte a Stale-While-Revalidate garantindo transições instantâneas.
