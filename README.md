# AgentMark Example App

A minimal, working AgentMark app built on the **Vercel AI SDK adapter** (`@agentmark-ai/ai-sdk-v5-adapter`). It shows the full loop:

- a `.prompt.mdx` prompt (`agentmark/greeting.prompt.mdx`)
- a configured client (`agentmark.client.ts`) — loader + model registry + adapter
- a **dev handler** (`dev-entry.ts`) for `agentmark dev`
- a **deploy handler** (`handler.ts`) for AgentMark Cloud
- a runnable **tracing** example (`src/agent.ts`) that emits an AgentMark trace
- a **dataset** (`agentmark/greeting.jsonl`) + **evals** scored during experiments

## Files

| File                          | Purpose                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| `agentmark/greeting.prompt.mdx` | The text prompt (model, messages, input schema, `test_settings`). |
| `agentmark/greeting.jsonl`    | Dataset rows (`name` + `interest`) for experiments.                  |
| `agentmark.client.ts`         | Loader (local vs. Cloud) + model registry + adapter + **eval functions**. |
| `agentmark.json`              | Project config incl. `scores` (schemas) and `evals` (registered names). |
| `dev-entry.ts`                | Webhook server entry point used by `agentmark dev`.                  |
| `handler.ts`                  | Deployment entry point. Dispatches `prompt-run` / `dataset-run` / `get-evals`. |
| `src/tracing.ts`              | Tracing wired at startup — `initTracing({ registerGlobally: true })`. Import before any LLM call. |
| `src/agent.ts`                | Standalone script: load → format (with telemetry) → `generateText` → trace. |
| `src/trace.ts`                | Minimal one-call trace producer (no Cloud-synced prompt needed). `npm run trace`. |

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

## Tracing

Tracing is wired once in `src/tracing.ts` and imported before any LLM call. It
needs `AGENTMARK_API_KEY` / `AGENTMARK_APP_ID` (and `OPENAI_API_KEY` for the
model call) in `.env`. With `AGENTMARK_BASE_URL` unset, traces go to AgentMark
Cloud (`https://api.agentmark.co`).

Produce one trace with a minimal, self-contained call (works before your prompts
are synced to Cloud):

```bash
npm run trace
```

`src/agent.ts` is the fuller example — it loads the `greeting` prompt through the
adapter, then traces the run:

```bash
npm run agent
```

**Deployed handler:** `handler.ts` imports `./src/tracing` as its first line, so
tracing is initialized at Cloud startup. This is required and easy to miss — the
canonical handler omits it, and without a registered global tracer the experiment
runs but every span silently goes to a no-op tracer, so **no traces appear in the
Dashboard**. (Verified: a span is `isRecording: false` before the import,
`isRecording: true` after.)

Tracing notes (each fails silently if wrong):

- `initTracing({ registerGlobally: true })` is **required** — the AI SDK emits the
  model/generation span through the global OpenTelemetry tracer.
- Every `generateText` call must opt in via `telemetry: { isEnabled: true }` on
  `prompt.format()`, or it emits no spans.
- In a short-lived script, `disableBatch: true` plus `forceFlush()` + `shutdown()`
  before exit ensures spans are sent.

## Evaluations

Two boolean evals score each greeting during experiments:

- `mentions_name` — the reply addresses the recipient by name.
- `two_sentences_max` — the reply stays within the two-sentence instruction.

The wiring spans three files: the functions are registered in `agentmark.client.ts`
(`evals`), their score schemas are declared in `agentmark.json` (`scores` + `evals`),
and the prompt opts in via `test_settings.evals`. Run them against the dataset:

```bash
npx agentmark dev          # leave running
npx agentmark run-experiment agentmark/greeting.prompt.mdx
```

Each eval receives `{ input, output, expectedOutput }` — where `input` is the
**rendered messages array** (not the raw props), so `mentions_name` parses the
recipient from the user turn.

### `get-evals` (control-plane)

When you set up an experiment in the Dashboard, the **Evaluations** picker is
populated by a `get-evals` webhook job: the gateway asks your deployed handler
which evals it has registered. `handler.ts` answers it from the client's eval
registry, returning `{ type: "evals", result: <JSON names>, traceId: "" }`. So a
third event type joins `prompt-run` / `dataset-run`. (Forward-compatible: it
prefers the official `client.getEvalNames()` once your installed packages expose
it, falling back to the registry on current versions.)

## Deploy

Connect this repo in the AgentMark Dashboard and push. The pipeline detects
`handler.ts` and runs your prompts/experiments against the deployed client.
AgentMark Cloud injects `AGENTMARK_API_KEY`, `AGENTMARK_APP_ID`, and
`AGENTMARK_BASE_URL`; set `OPENAI_API_KEY` under **Settings → Environment variables**.
