// AgentMark tracing — wire this in once at app startup.
//
// Import this module before any LLM calls so spans are captured. With
// `node --env-file=.env`, env vars are loaded before this module evaluates.
//
// `registerGlobally: true` is REQUIRED: the Vercel AI SDK emits the model
// (generation) span — model, tokens, input/output — through the *global*
// OpenTelemetry tracer. Without it that span silently goes to a no-op tracer.
//
// `disableBatch: true` exports spans immediately, which is what short-lived
// scripts (CLI, serverless, cron) want. Long-running servers can drop it.
import { AgentMarkSDK } from "@agentmark-ai/sdk";

const sdk = new AgentMarkSDK({
  apiKey: process.env.AGENTMARK_API_KEY!,
  appId: process.env.AGENTMARK_APP_ID!,
  // Unset -> defaults to https://api.agentmark.co (AgentMark Cloud).
  baseUrl: process.env.AGENTMARK_BASE_URL,
});

export const tracing = sdk.initTracing({
  registerGlobally: true,
  disableBatch: true,
});
