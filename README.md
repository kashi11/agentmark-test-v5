# AgentMark Example App

A minimal, working AgentMark app built on the **Vercel AI SDK adapter** (`@agentmark-ai/ai-sdk-v5-adapter`). It shows the full loop:

- a `.prompt.mdx` prompt (`agentmark/greeting.prompt.mdx`)
- a configured client (`agentmark.client.ts`) — loader + model registry + adapter
- a **dev handler** (`dev-entry.ts`) for `agentmark dev`
- a **deploy handler** (`handler.ts`) for AgentMark Cloud
- a runnable **tracing** example (`src/agent.ts`) that emits an AgentMark trace

## Files

| File                          | Purpose                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| `agentmark/greeting.prompt.mdx` | The text prompt (model, system/user messages, input schema).      |
| `agentmark.client.ts`         | Wires the loader (local dev vs. Cloud), model registry, and adapter. |
| `dev-entry.ts`                | Webhook server entry point used by `agentmark dev`.                  |
| `handler.ts`                  | Deployment entry point AgentMark Cloud invokes (one `{type,data}` event). |
| `src/agent.ts`                | Standalone script: load → format (with telemetry) → `generateText` → trace. |

## Setup

```bash
npm install
cp .env.example .env   # then fill in OPENAI_API_KEY (+ AgentMark creds for tracing)
```

## Run it locally

Start the dev stack (serves prompts + runs them through the client), then run the prompt:

```bash
npx agentmark dev          # leave running in one terminal
npx agentmark run-prompt agentmark/greeting.prompt.mdx
```

## Run the traced example

`src/agent.ts` makes one real model call and ships a trace to AgentMark. It needs
`AGENTMARK_API_KEY` / `AGENTMARK_APP_ID` (for tracing) and `OPENAI_API_KEY` in `.env`:

```bash
npm run agent
```

Tracing notes (each fails silently if wrong):

- `initTracing({ registerGlobally: true })` is **required** — the AI SDK emits the
  model/generation span through the global OpenTelemetry tracer.
- Every `generateText` call must opt in via `telemetry: { isEnabled: true }` on
  `prompt.format()`, or it emits no spans.
- In a short-lived script, `disableBatch: true` plus `forceFlush()` + `shutdown()`
  before exit ensures spans are sent.

## Deploy

Connect this repo in the AgentMark Dashboard and push. The pipeline detects
`handler.ts` and runs your prompts/experiments against the deployed client.
AgentMark Cloud injects `AGENTMARK_API_KEY`, `AGENTMARK_APP_ID`, and
`AGENTMARK_BASE_URL`; set `OPENAI_API_KEY` under **Settings → Environment variables**.
