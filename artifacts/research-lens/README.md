# ResearchLens

ResearchLens is an AI research workspace for uploading papers, asking evidence-grounded questions, comparing documents, and inspecting retrieval quality.

## Product overview

- Dashboard with workspaces, indexed chunk counts, recent questions, and grounding health
- Workspace view with document library, indexing status, conversation history, chat, retrieved evidence, and citations
- Document comparison mode with grounded method/problem/limitation rows
- Evaluation lab for retrieval precision, citation coverage, groundedness, relevance, latency, and experiment history
- Settings surface for retrieval defaults

The first build runs in a safe demo mode with seeded research papers and deterministic hybrid-style retrieval. If `OPENAI_API_KEY` is available on the server, chat answers are generated from the retrieved excerpts through the OpenAI Chat Completions API. If live generation is unavailable, the grounded demo answer path remains available.

## Architecture

```text
React + Vite
   │ generated React Query hooks
   ▼
OpenAPI contract → Orval client + Zod schemas
   │
   ▼
Express API server
   ├─ workspace/document/conversation routes
   ├─ query intent routing
   ├─ lexical + semantic-style retrieval abstraction
   ├─ reranking and citation assembly
   ├─ grounding coverage checks
   └─ comparison and evaluation services
```

The API contract is the source of truth at `lib/api-spec/openapi.yaml`. Generated client hooks and server validation are regenerated with:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Local development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/research-lens run dev
```

For a standalone deployment, the frontend accepts `VITE_API_URL` at build time. Leave it empty when the frontend and API share an origin, or set it to the public API URL when they are deployed separately. The API accepts `PORT` and `CORS_ORIGIN`.

## Environment variables

- `OPENAI_API_KEY` — optional server-only key for live grounded answer generation
- `PORT` — API listen port, default `8080`
- `CORS_ORIGIN` — comma-separated frontend origins allowed to call the API
- `VITE_API_URL` — frontend build-time API origin; omit for same-origin deployments
- `DATABASE_URL` — reserved for the persistent database implementation

No secret is exposed in the frontend.

## RAG behavior

1. A question is classified into document retrieval, cross-document search, comparison, or limitations synthesis.
2. The query is tokenized and matched against indexed chunk terms.
3. Candidate chunks are scored and reranked.
4. The top evidence is assembled into a context window.
5. Answers are generated only from that evidence and must include citation markers.
6. The response reports grounding status and evidence coverage alongside the answer.

## API surface

The API includes endpoints for:

- overview and workspaces
- document upload/register and reindex
- conversations and grounded questions
- retrieval statistics
- grounded comparisons
- evaluation summary and experiment runs

## Limitations and next steps

The demo-safe first build keeps document bytes and indexed vectors in process memory. A production deployment should add object storage for uploaded files, a PostgreSQL schema for workspaces/documents/chunks/messages/evaluations, a real PDF extraction and page-preserving chunker, and a pgvector-backed embedding index. These can be added behind the existing contract without changing the research UI.

## Standalone deployment

```bash
corepack enable
pnpm install --frozen-lockfile

# Terminal 1: API
PORT=8080 CORS_ORIGIN=http://localhost:5173 \
  pnpm --filter @workspace/api-server run build
PORT=8080 CORS_ORIGIN=http://localhost:5173 \
  pnpm --filter @workspace/api-server run start

# Terminal 2: frontend
VITE_API_URL=http://localhost:8080 \
  pnpm --filter @workspace/research-lens run build
pnpm --filter @workspace/research-lens run serve
```

The frontend is a static Vite build and can be hosted on Netlify, Vercel, Cloudflare Pages, Nginx, or any static host. The API is a regular Node/Express process and can run on Render, Railway, Fly.io, ECS, or a VM.

For a local containerized deployment:

```bash
cp .env.example .env
docker compose up --build
```