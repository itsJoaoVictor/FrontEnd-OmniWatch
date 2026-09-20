# Graph Report - c:\Codigos\Projetos Pessoais\OmniWatch\FrontEnd-OmniWatch  (2026-09-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 268 nodes · 406 edges · 22 communities (17 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8add79a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- dependencies
- compilerOptions
- devDependencies
- dropdown-menu.tsx
- carousel.tsx
- components.json
- ContentCarousel.tsx
- SearchDropdown.tsx
- layout.tsx
- page.tsx
- Topbar.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 45 edges
2. `compilerOptions` - 16 edges
3. `Button()` - 10 edges
4. `include` - 7 edges
5. `tailwind` - 6 edges
6. `aliases` - 6 edges
7. `useCarousel()` - 6 edges
8. `Carousel()` - 6 edges
9. `scripts` - 5 edges
10. `react` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Carousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `ThemeToggle()` --references--> `react`  [EXTRACTED]
  src/components/theme-toggle.tsx → package.json
- `DropdownMenuSubTrigger()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuSubContent()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "cn"
Cohesion: 0.12
Nodes (25): Button(), buttonVariants, Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader() (+17 more)

### Community 1 - "dependencies"
Cohesion: 0.06
Nodes (31): axios, @base-ui/react, class-variance-authority, clsx, embla-carousel-react, @hookform/resolvers, lucide-react, next (+23 more)

### Community 2 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 4 - "dropdown-menu.tsx"
Cohesion: 0.10
Nodes (17): react, react, LoginForm(), RegisterForm(), ThemeToggle(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent() (+9 more)

### Community 5 - "carousel.tsx"
Cohesion: 0.15
Nodes (19): TrendingCarousel(), TrendingCarouselProps, getTrendingData(), TrendingSection(), Carousel(), CarouselApi, CarouselContent(), CarouselContext (+11 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "ContentCarousel.tsx"
Cohesion: 0.24
Nodes (10): getHomeData(), HomeData, HomePage(), ContentCarousel(), ContentCarouselProps, HeroBanner(), HeroFeatureProps, MediaCard() (+2 more)

### Community 8 - "SearchDropdown.tsx"
Cohesion: 0.23
Nodes (7): SearchDropdownProps, SearchEmptyState(), SearchEmptyStateProps, SearchResultItem(), SearchResultItemProps, SearchItem, SearchMultiResponse

### Community 9 - "layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, ThemeProvider(), Toaster()

## Knowledge Gaps
- **91 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `react` connect `dropdown-menu.tsx` to `dependencies`, `carousel.tsx`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `page.tsx`, `dropdown-menu.tsx`, `carousel.tsx`, `ContentCarousel.tsx`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.12427409988385599 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._