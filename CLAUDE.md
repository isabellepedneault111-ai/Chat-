# CLAUDE.md — AI Assistant Guide for This Repository

This file provides guidance for AI coding assistants working on this codebase.

---

## Project Overview

**TanStack Chat** is a full-stack AI chat application powered by Claude (Anthropic). It is built with TanStack Start (a full-stack React meta-framework), uses TanStack Router for routing, TanStack Store for state management, and optionally Convex for persistent database storage. The application is designed for deployment on Netlify.

The main project lives in `tanstack-template-main/`.

---

## Repository Layout

```
Chat-/
├── tanstack-template-main/      # Main application (work here)
│   ├── src/                     # Frontend source code
│   │   ├── components/          # React UI components
│   │   ├── routes/              # TanStack Router pages
│   │   ├── store/               # State management (TanStack Store)
│   │   ├── utils/               # Utilities (AI integration)
│   │   ├── api.ts               # TanStack Start API handler
│   │   ├── client.tsx           # Client entry (hydration + Sentry)
│   │   ├── convex.tsx           # Convex provider wrapper
│   │   ├── router.tsx           # Router initialization
│   │   ├── ssr.tsx              # Server-side rendering entry
│   │   └── styles.css           # Global Tailwind CSS styles
│   ├── convex/                  # Convex backend functions
│   │   ├── conversations.ts     # DB queries and mutations
│   │   ├── schema.ts            # Database schema
│   │   └── _generated/          # Auto-generated Convex types (do not edit)
│   ├── public/                  # Static assets
│   ├── app.config.ts            # TanStack Start config (Netlify preset)
│   ├── vite.config.js           # Vite build config
│   ├── tsconfig.json            # TypeScript config
│   ├── postcss.config.ts        # PostCSS / Tailwind config
│   ├── netlify.toml             # Netlify deployment config
│   └── package.json             # Dependencies and scripts
└── Flip                         # Unrelated standalone HTML file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start + Vinxi |
| Routing | TanStack Router (file-based, auto code-split) |
| State | TanStack Store |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| AI | Anthropic SDK — Claude 3.5 Sonnet |
| DB (optional) | Convex |
| Error monitoring (optional) | Sentry |
| Build | Vite 6 |
| Deployment | Netlify |
| Language | TypeScript 5.7 (strict mode) |

---

## Development Commands

All commands run from `tanstack-template-main/`:

```bash
npm run dev      # Start development server (vinxi dev)
npm run build    # Production build
npm run serve    # Preview production build locally
npm start        # Alias for dev
```

No test runner is currently configured. `jsdom` is a dev dependency but no test files exist yet.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | **Yes** | Anthropic API key. Checked as `process.env.ANTHROPIC_API_KEY` or `import.meta.env.VITE_ANTHROPIC_API_KEY` |
| `VITE_CONVEX_URL` | No | Convex deployment URL. If absent, the app runs in local-only mode (no persistence) |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error monitoring |
| `SENTRY_AUTH_TOKEN` | No | Enables Sentry source map uploads during build |

Create a `.env` file in `tanstack-template-main/` for local development:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_CONVEX_URL=https://...convex.cloud   # optional
VITE_SENTRY_DSN=https://...              # optional
```

---

## Key Architecture Patterns

### 1. AI Integration (`src/utils/ai.ts`)

- Uses `createServerFn` from TanStack React Start to run server-side code.
- Calls `anthropic.messages.stream()` with model `claude-3-5-sonnet-20241022`.
- Returns a `ReadableStream` for streaming responses.
- Error types handled: rate limit, authentication failure, connection error.
- A default system prompt instructs the model to use Markdown formatting. A user-configurable system prompt is **appended** to the default (not replacing it).
- `max_tokens` is set to `4096`.

### 2. State Management (`src/store/`)

**`store.ts`** — TanStack Store singleton with:
- `State` shape: `{ prompts, conversations, currentConversationId, isLoading }`
- `actions` object — all state mutations (pure `store.setState` calls)
- `selectors` object — derived/filtered reads

**`hooks.ts`** — Two custom hooks:
- `useAppState()` — exposes store state + actions for components that don't need Convex awareness
- `useConversations()` — hybrid hook: updates local store first (optimistic), then syncs to Convex if `VITE_CONVEX_URL` is set. Convex availability is checked once at module load via `Boolean(import.meta.env.VITE_CONVEX_URL)`.

**Optimistic update pattern**: every write action updates local store immediately, then fires an async Convex mutation. Errors from Convex are logged but do not roll back local state.

### 3. Convex Backend (`convex/`)

Functions exposed via `api.conversations.*`:
- `list` — returns all conversations
- `get(id)` — single conversation lookup
- `create(title, messages?)` — inserts a new conversation, returns Convex ID
- `updateTitle(id, title)` — patches the title field
- `addMessage(conversationId, message)` — appends a message to the array
- `remove(id)` — deletes a conversation

Schema (`convex/schema.ts`): `conversations` table with `title: string` and `messages: Array<{id, role, content}>`.

The `convex/_generated/` directory is auto-generated — never edit it manually. Run `npx convex dev` to regenerate after schema changes.

### 4. Routing (`src/routes/`)

TanStack Router with file-based routes:
- `__root.tsx` — root layout (wraps all pages)
- `index.tsx` — home page, contains the main chat UI logic

`src/routeTree.gen.ts` is auto-generated from the file structure. Do not edit manually.

### 5. Convex Provider (`src/convex.tsx`)

Conditionally wraps the app with `ConvexProvider` only when `VITE_CONVEX_URL` is set. This enables graceful degradation — the app works fully without Convex (local-only mode).

---

## Component Overview

| Component | File | Purpose |
|-----------|------|---------|
| `ChatMessage` | `src/components/ChatMessage.tsx` | Renders a single message with Markdown + syntax highlighting (highlight.js) |
| `ChatInput` | `src/components/ChatInput.tsx` | Auto-growing textarea + send button |
| `Sidebar` | `src/components/Sidebar.tsx` | Conversation list with create/rename/delete |
| `SettingsDialog` | `src/components/SettingsDialog.tsx` | System prompt management UI |
| `WelcomeScreen` | `src/components/WelcomeScreen.tsx` | Shown before any conversation is created |
| `LoadingIndicator` | `src/components/LoadingIndicator.tsx` | Animated "thinking" dots |

All components are re-exported from `src/components/index.ts`.

---

## Coding Conventions

### TypeScript
- Strict mode is enabled (`tsconfig.json`).
- Use explicit interfaces for props: `interface FooProps { ... }`.
- Prefer `interface` over `type` for object shapes.
- The `Message` type is defined in `src/utils/ai.ts` and shared across the codebase.

### React
- Functional components only.
- Hooks: `useCallback` for memoized callbacks, `useMemo` for derived values, `useRef` for DOM refs.
- State from TanStack Store via `useStore(store, selector)`.

### Naming
- **Components / interfaces**: PascalCase (`ChatMessage`, `Conversation`)
- **Functions / variables**: camelCase (`handleSubmit`, `currentConversationId`)
- **Files**: PascalCase for components (`ChatMessage.tsx`), camelCase for utilities and store files (`hooks.ts`, `store.ts`)

### Styling
- Tailwind CSS utility classes only — no inline styles, no CSS modules.
- Dark theme throughout: `bg-gray-900`, `text-white`, `text-gray-*`.
- Brand accent: orange-to-red gradient (`from-orange-500 to-red-600`).
- Responsive classes used where needed.

### Server Functions
- Server-side logic goes in `createServerFn` handlers (see `src/utils/ai.ts`).
- These run on the server in SSR/Netlify Functions context — safe for secrets.
- Validators must be declared on the server function for type safety.

### Error Handling
- Catch API/Convex errors; display user-friendly messages in the UI.
- Do not surface raw stack traces to the user.
- For Convex mutations: log errors, but keep local state intact (no rollback).

---

## Adding New Features

### New component
1. Create `src/components/NewComponent.tsx`
2. Export it from `src/components/index.ts`
3. Import it where needed

### New route/page
1. Add a file to `src/routes/` following TanStack Router naming conventions
2. The `routeTree.gen.ts` is auto-generated — run `npm run dev` to trigger regeneration

### New Convex backend function
1. Add a `query` or `mutation` to `convex/conversations.ts` (or a new file)
2. Run `npx convex dev` to regenerate `convex/_generated/`
3. Import via `api.yourFile.yourFunction` in hooks

### New state slice
1. Add fields to the `State` interface in `store.ts`
2. Add corresponding `actions` and `selectors`
3. Expose via `useAppState()` or a new hook in `hooks.ts`

### Changing the AI model or parameters
- Edit `src/utils/ai.ts` — the `anthropic.messages.stream()` call
- Model name: `claude-3-5-sonnet-20241022`
- Max tokens: `4096`
- Timeout: `30000` ms

---

## Deployment (Netlify)

- The server preset in `app.config.ts` is `"netlify"`, which generates Netlify Functions for server-side routes.
- `netlify.toml` defines the template environment variable `VITE_ANTHROPIC_API_KEY`.
- Set all required environment variables in the Netlify dashboard.
- Build command: `npm run build`
- Publish directory: `.output/public` (managed by Vinxi/TanStack Start)

---

## What Not to Touch

- `convex/_generated/` — auto-generated, regenerated by Convex CLI
- `src/routeTree.gen.ts` — auto-generated by TanStack Router plugin
- `package-lock.json` — update only via `npm install`

---

## Optional Services

Both Convex and Sentry are strictly optional. The app works without them:
- **Without `VITE_CONVEX_URL`**: conversations are stored in-memory only (lost on refresh)
- **Without `VITE_SENTRY_DSN`**: no error monitoring; source maps are not generated during build
