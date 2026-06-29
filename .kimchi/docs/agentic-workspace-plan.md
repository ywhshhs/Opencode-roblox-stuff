# Agentic AI Workspace - Build Plan

## Overview
Build a modern web app (agentic workspace) with React 19, TypeScript, Tailwind v4, Vite - leveraging existing shadcn/ui components.

## Tech Stack
- React 19 + TypeScript 5.9
- Vite 7 + @vitejs/plugin-react
- Tailwind v4 + @tailwindcss/vite
- shadcn/ui (already in @workspace/mockup-sandbox)
- wouter (lightweight router)
- sonner (toasts)
- lucide-react (icons)
- framer-motion (animations)
- next-themes (dark/light)
- zod + react-hook-form (forms)

## Architecture
```
agentic-workspace/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn primitives (copy from mockup-sandbox)
│   │   ├── chat/         # Chat interface components
│   │   ├── workspace/    # Workspace layout (tabs, panels)
│   │   ├── providers/    # Model provider configuration
│   │   ├── settings/     # Settings panels
│   │   ├── research/     # Deep research UI
│   │   └── web-search/   # Web search provider config
│   ├── hooks/
│   ├── lib/
│   ├── stores/           # Zustand-like state (via React context/hooks)
│   ├── types/            # Type definitions
│   └── pages/            # Route pages
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Features
1. **Workspace layout** - Resizable panels, sidebar, tabbed interface
2. **Chat interface** - Message list with markdown, code blocks, thinking blocks
3. **Model selector** - Dropdown to pick from configured models
4. **Model providers** - Add OpenAI/Anthropic-compatible endpoints (auto-fetch models)
5. **Provider settings** - API key toggle, endpoint config, reasoning toggle
6. **Reasoning/thinking** - Collapsible reasoning blocks, thinking animation
7. **Deep research** - Multi-step research mode with depth control
8. **Web search** - Tavily, Exa, Brave, DuckDuckGo, SearXNG, etc.
9. **Responsive** - Mobile + desktop with adaptive layout

## Build Steps
Phase 1: Project scaffold (package.json, vite config, basic layout)
Phase 2: Core components (tabs, panels, chat, settings)
Phase 3: Model/provider management with auto-fetch
Phase 4: Search & research features
Phase 5: Polish and responsive design