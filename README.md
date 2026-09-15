# ResearchLens

ResearchLens is a standalone AI research workspace for asking grounded questions over papers, comparing documents, following page-level citations, and evaluating retrieval quality.

## What is included

- React + Vite frontend
- Express API server
- OpenAPI contract with generated React Query hooks and Zod schemas
- Grounded research chat with citations and insufficiency handling
- Document comparison and retrieval evaluation flows
- Optional server-side OpenAI answer generation
- Dockerfiles for the API and static frontend
- Docker Compose configuration for local deployment

## Quick start

Requirements: Node.js 22+, Corepack, and pnpm.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Run the API:

```bash
pnpm --filter @workspace/api-server run build
PORT=8080 CORS_ORIGIN=http://localhost:5173 \
  pnpm --filter @workspace/api-server run start
```

Run the frontend in another terminal:

```bash
VITE_API_URL=http://localhost:8080 \
  pnpm --filter @workspace/research-lens run dev
```

Open `http://localhost:5173`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:8080/api/healthz`

For separate hosting, build the frontend with `VITE_API_URL` set to the public API origin. Set `CORS_ORIGIN` on the API to the deployed frontend origin.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Optional server-only key for live grounded answer generation |
| `PORT` | API listen port; defaults to `8080` in deployment |
| `CORS_ORIGIN` | Comma-separated frontend origins allowed by the API |
| `VITE_API_URL` | Frontend build-time API origin; omit for same-origin hosting |

## Current data mode

The included demo corpus and indexed chunks are in memory so the complete product flow works immediately. For production-scale use, add persistent document storage, PDF extraction, PostgreSQL records, and a pgvector-backed embedding index behind the existing API contract.

## Project layout

```text
artifacts/research-lens/   React + Vite frontend
artifacts/api-server/      Express API
lib/api-spec/              OpenAPI source and codegen
lib/api-client-react/      Generated React Query client
lib/api-zod/               Generated validation schemas
Dockerfile.web             Static frontend image
Dockerfile.api             API image
docker-compose.yml         Local two-service deployment
```