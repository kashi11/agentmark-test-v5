// Cloud deployment handler (managed code execution).
//
// When you deploy this app to AgentMark Cloud (git-based deploy), the gateway
// invokes this default export to run prompts and experiments server-side via
// the AI SDK adapter. Mirrors the local dev-server, minus the HTTP plumbing.

import { VercelAdapterWebhookHandler } from "@agentmark-ai/ai-sdk-v5-adapter/runner";
import { AgentMarkSDK } from "@agentmark-ai/sdk";
import { client } from "./agentmark.client";

const sdk = new AgentMarkSDK({
  apiKey: process.env.AGENTMARK_API_KEY ?? "",
  appId: process.env.AGENTMARK_APP_ID ?? "",
  baseUrl: process.env.AGENTMARK_BASE_URL,
});
sdk.initTracing({ disableBatch: true });

const adapter = new VercelAdapterWebhookHandler(client as never);

export default async function handler(request: {
  type: "prompt-run" | "dataset-run" | "get-evals";
  data: {
    ast?: never;
    customProps?: Record<string, unknown>;
    options?: { shouldStream?: boolean };
    experimentId?: string;
    datasetPath?: string;
  };
}) {
  switch (request.type) {
    case "get-evals":
      return {
        type: "evals" as const,
        result: JSON.stringify(Object.keys(client.getEvalRegistry())),
        traceId: "",
      };
    case "prompt-run":
      return adapter.runPrompt(request.data.ast!, {
        shouldStream: request.data.options?.shouldStream,
        customProps: request.data.customProps,
      });
    case "dataset-run":
      return adapter.runExperiment(
        request.data.ast!,
        request.data.experimentId ?? "",
        request.data.datasetPath,
      );
    default:
      throw new Error(`Unknown request type: ${(request as { type: string }).type}`);
  }
}
