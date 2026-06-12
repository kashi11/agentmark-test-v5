// AgentMark Cloud deployment entry point. The deployment pipeline bundles
// this file and wraps it in a managed HTTP server.
import { AgentMarkSDK, createWebhookRunner } from "@agentmark-ai/sdk";
import { client } from "./agentmark.client";
import { executor } from "./executor";

// Initialize tracing once, at module load — before any run is dispatched.
// The deployment pipeline injects AGENTMARK_API_KEY / AGENTMARK_APP_ID /
// AGENTMARK_BASE_URL automatically. registerGlobally: true is REQUIRED to
// capture the AI SDK's model (generation) span, which emits through the
// global OTel tracer — without it you get the wrapper span but no model,
// token, or input/output data. See /observe/tracing-setup.
const sdk = new AgentMarkSDK({
  apiKey: process.env.AGENTMARK_API_KEY!,
  appId: process.env.AGENTMARK_APP_ID!,
  baseUrl: process.env.AGENTMARK_BASE_URL,
});
sdk.initTracing({ registerGlobally: true });

// The deployed handler IS the runner's dispatch — it routes prompt-run,
// dataset-run, and the control-plane get-evals events, sourcing evals from
// the runner's client.
const runner = createWebhookRunner({ client, executor });

export default (body: Parameters<typeof runner.dispatch>[0]) => runner.dispatch(body);
