# my-agentmark-app

Example AgentMark project: one prompt + dataset, wired to run on **Anthropic Haiku**
via the **AI SDK (ai-sdk-v5) adapter**.

## Layout

| Path | Role |
|---|---|
| `agentmark/support-agent/support-agent.prompt.mdx` | The prompt (`model_name: claude-haiku-4-5`) |
| `agentmark/support-agent/dataset.jsonl` | Test rows for `run-experiment` |
| `agentmark.client.ts` | Configured client: AI SDK adapter + Anthropic provider |
| `dev-server.ts` | Local webhook **handler** booted by `agentmark dev` |
| `handler.ts` | Cloud deployment **handler** (git-based deploys) |
| `run.ts` | Direct `generateText` example |
| `agentmark.types.ts` | Generated types (`npm run generate-types`) |

## Requirements

- **Node 22.** The `agentmark` CLI bundles `better-sqlite3` (a native module). This
  repo's copy is compiled for the Node 22 ABI — run `nvm use` (reads `.nvmrc`).
  On another Node version, run `npm rebuild better-sqlite3 --build-from-source`.
- An `ANTHROPIC_API_KEY` — copy `.env.example` to `.env` and fill it in.

## Run it

```bash
nvm use                       # Node 22
cp .env.example .env          # add your ANTHROPIC_API_KEY

# Terminal 1 — local dev server (API :9418, webhook :9417)
npm run dev

# Terminal 2 — run the prompt against one input...
npx agentmark run-prompt agentmark/support-agent/support-agent.prompt.mdx \
  --props '{"question":"Do you support Anthropic models?","product":"AgentMark"}'

# ...or run the whole dataset as an experiment
npx agentmark run-experiment agentmark/support-agent/support-agent.prompt.mdx

# Or execute directly with the AI SDK (no dev server needed for the call itself,
# but the loader still reads templates from the dev server on :9418):
npm run start
```

## Deploy to AgentMark Cloud

`agentmark login` → `agentmark link`, then push to the watched branch. The Cloud
gateway invokes `handler.ts` to execute prompts server-side.
