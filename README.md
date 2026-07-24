# genai-ui

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)
[![GitHub license](https://img.shields.io/github/license/ai4os/genai-ui.svg)](https://github.com/ai4os/genai-ui/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/ai4os/genai-ui.svg)](https://github.com/ai4os/genai-ui/releases)

> ⚠️ **Warning**
>
> This repository is under active development. Some features may be incomplete or not fully functional.

Web app that provides a stable frontend for chat management, AI agents, MCP tools, databases and other AI services.

## Architecture

`genai-ui` is one piece of a larger system:

- **Frontend** (this repo) — Next.js chat interface: chat management, streaming responses, model selection.
- **Backend** ([`genai-api`](https://github.com/ai4os/genai-api)) — FastAPI backend: chats, messages, model selection. This UI consumes it exclusively through its own server (BFF pattern — see below), never directly from the browser.
- **Keycloak** — authentication provider. Realm `ai4eosc`, client `genai-ui` (confidential, with secret). The UI never talks to Keycloak from the browser either; all token exchange happens server-side.

This frontend follows the **BFF (Backend for Frontend)** pattern: the browser never talks directly to `genai-api` nor to Keycloak. All communication goes through the Next.js server:

- **Reads** → Server Components call straight into `lib/api/`.
- **Writes** → Server Actions or dedicated Route Handlers, never a client-side `fetch` against `genai-api`.
- Assistant responses arrive **streamed (SSE)**, relayed by a Route Handler that acts as a transparent proxy between the browser and `genai-api`.

## Requirements

- Node.js 20+
- pnpm 9+ (`corepack enable` if not already installed)
- Access to a Keycloak realm with a client configured
- A running instance of [`genai-api`](https://github.com/ai4os/genai-api) (local or remote), with its own database already migrated


## Configuration

The app reads its configuration from environment variables, loaded from `.env.local`.

```bash
# Base URL of the backend API (genai-api)
API_URL=http://localhost:8000

# Keycloak provider
AUTH_KEYCLOAK_ID=<your-client-id>
AUTH_KEYCLOAK_SECRET=<your-client-secret>
AUTH_KEYCLOAK_ISSUER=https://<your-keycloak-host>/realms/<realm>
```


## Local deployment

1. **Install the dependencies**

   ```bash
   pnpm install
   ```

3. **Set up your environment variables**

   Copy the block described in [Configuration](#configuration) into a `.env.local` file and fill in the values.

4. **Run the app**

   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`.


## Usage

Available scripts:

```bash
pnpm dev      # development server (Turbopack)
pnpm build    # production build
pnpm start    # run the production build
pnpm lint     # ESLint
```


## How to contribute

The repository is formatted and linted with [ESLint](https://eslint.org).
Commit messages follow [Conventional Commits](https://conventionalcommits.org).

