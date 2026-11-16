# genai-ui

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)
[![GitHub license](https://img.shields.io/github/license/ai4os/genai-ui.svg)](https://github.com/ai4os/genai-ui/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/ai4os/genai-ui.svg)](https://github.com/ai4os/genai-ui/releases)

Web app that provides a stable frontend for chat management, AI agents, MCP tools, databases and other AI services.

## Architecture

`genai-ui` is a single-page application (React + Vite) and one piece of a larger system:

- **Frontend** (this repo) — chat interface: chat management, streaming responses, model/agent selection, knowledge collections.
- **Backend** ([`genai-api`](https://github.com/ai4os/genai-api)) — FastAPI backend. The browser calls it **directly**, sending the user's Keycloak access token as a `Bearer` header. The API must allow this origin through CORS.
- **Keycloak** — authentication provider. Realm `ai4eosc`, client `genai-ui`: a **public** client using the Authorization Code flow with **PKCE**. There is no client secret.

## Requirements

- Node.js 22.12+ or 24
- pnpm 9+ (`corepack enable` if not already installed)
- A Keycloak realm with the `genai-ui` client configured (see below)
- A running instance of [`genai-api`](https://github.com/ai4os/genai-api) with `CORS_ORIGINS` including this app's origin

### Keycloak client

| Setting | Value |
|---|---|
| Client ID | `genai-ui` |
| Client authentication | Off (public client) |
| Standard flow | On |
| Valid redirect URIs / post logout URIs | `http://localhost:5173/*` (+ the deployed URLs) |
| Web origins | `http://localhost:5173` (+ the deployed origins) |
| Audience | Mapper adding `genai-api` to the access token |

## Configuration

Copy the following into `.env.local` (not versioned). Vite exposes every `VITE_*` variable to the browser, so **never put secrets here**.

```bash
VITE_OIDC_AUTHORITY=https://login.example.org/realms/ai4eosc
VITE_OIDC_CLIENT_ID=genai-ui
VITE_API_URL=https://api.example.org
```

## Local deployment

```bash
git clone https://github.com/ai4os/genai-ui.git
cd genai-ui
pnpm install
# create .env.local as described above
pnpm dev
```

The app is available at `http://localhost:5173`.

## Usage

```bash
pnpm dev      # development server
pnpm build    # type-check + production build (dist/)
pnpm preview  # serve the production build locally
pnpm lint     # ESLint
```

## Project structure

```text
public/
├── logos/                 # Application and project logos
└── models/                # Model/provider icons

src/
├── App.tsx                # Application routes
├── main.tsx               # React, authentication, and query providers
├── components/
│   └── ui/                # Reusable UI primitives
├── content/               # Centralized user-facing copy
├── features/
│   ├── auth/              # Route protection and user menu
│   ├── chat/
│   │   ├── api/           # Chat API and query hooks
│   │   ├── composer/      # Message composer and attachment handling
│   │   ├── messages/      # Message rendering, markdown, and sources
│   │   └── sending/       # Stream handling, errors, and pending messages
│   └── knowledge/
│       ├── api/           # Collection and document API/query hooks
│       └── dialogs/       # Collection and document dialogs
├── hooks/                 # Shared React hooks
├── layouts/               # Shared route layouts
├── lib/                   # Shared API, types, and utilities
├── pages/                 # Route-level page components
└── index.css              # Global styles
```

Feature-specific components, hooks, and API logic live in `features/`; `components/ui/` and `lib/` contain shared building blocks.


## Docker

The image is built with Node and served with nginx on port 3000. Vite bakes the configuration into the bundle at build time, so pass it as build arguments:

```bash
docker build \
  --build-arg VITE_OIDC_AUTHORITY=https://login.example.org/realms/ai4eosc \
  --build-arg VITE_OIDC_CLIENT_ID=genai-ui \
  --build-arg VITE_API_URL=https://api.example.org \
  -t genai-ui .
docker run -p 3000:3000 genai-ui
```

CI builds and pushes the images to Harbor (`-dev` from `develop`, `-prod` on each release created by release-please).

## How to contribute

The repository is linted with [ESLint](https://eslint.org) and commit messages follow [Conventional Commits](https://conventionalcommits.org). Before committing:

```bash
pnpm lint && pnpm build
```