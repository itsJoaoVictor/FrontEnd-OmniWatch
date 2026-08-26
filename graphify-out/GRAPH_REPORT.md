# Graph Report - FrontEnd-OmniWatch  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 184 nodes · 246 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- cn
- dependencies
- dropdown-menu.tsx
- components.json
- compilerOptions
- devDependencies
- include
- package.json
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 33 edges
2. `compilerOptions` - 16 edges
3. `Button()` - 7 edges
4. `include` - 7 edges
5. `tailwind` - 6 edges
6. `aliases` - 6 edges
7. `scripts` - 5 edges
8. `ThemeToggle()` - 4 edges
9. `lib` - 4 edges
10. `react` - 3 edges

## Surprising Connections (you probably didn't know these)
- `ThemeToggle()` --references--> `react`  [EXTRACTED]
  src/components/theme-toggle.tsx → package.json
- `DropdownMenuSubTrigger()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuSubContent()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "cn"
Cohesion: 0.13
Nodes (20): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), Input() (+12 more)

### Community 1 - "dependencies"
Cohesion: 0.07
Nodes (29): axios, @base-ui/react, class-variance-authority, clsx, @hookform/resolvers, lucide-react, next, next-themes (+21 more)

### Community 2 - "dropdown-menu.tsx"
Cohesion: 0.11
Nodes (18): react, react, RegisterForm(), ThemeToggle(), Button(), buttonVariants, DropdownMenu(), DropdownMenuCheckboxItem() (+10 more)

### Community 3 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (21): dom, dom.iterable, esnext, ./src/*, compilerOptions, allowJs, esModuleInterop, incremental (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 6 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 7 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 8 - "layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, ThemeProvider(), Toaster()

## Knowledge Gaps
- **79 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `dropdown-menu.tsx`, `package.json`?**
  _High betweenness centrality (0.286) - this node is a cross-community bridge._
- **Why does `react` connect `dropdown-menu.tsx` to `dependencies`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.13306451612903225 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dropdown-menu.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._
- **Should `components.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._