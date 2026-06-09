// AgentMark Cloud deployment entry point. The deployment pipeline bundles this
// file and wraps it in a managed HTTP server. Each Dashboard run (playground or
// experiment) arrives as one { type, data } event; handleWebhookRequest dispatches.
import {
  handleWebhookRequest,
  type WebhookRequest,
} from "@agentmark-ai/cli/runner-server";
import { VercelAdapterWebhookHandler } from "@agentmark-ai/ai-sdk-v5-adapter/runner";
import { client } from "./agentmark.client";

const webhookHandler = new VercelAdapterWebhookHandler(client);

export default function handler(event: WebhookRequest) {
  return handleWebhookRequest(event, webhookHandler);
}
