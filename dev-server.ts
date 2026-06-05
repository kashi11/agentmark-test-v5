// Local development webhook server entry point.
//
// `agentmark dev` boots the API server (:9418) and spawns this file as the
// webhook server (:9417). `run-prompt` / `run-experiment` post prompt ASTs
// here; the VercelAdapterWebhookHandler executes them via the AI SDK adapter.
//
// This file is version-controlled — customize as needed.

import { createWebhookServer } from "@agentmark-ai/cli/runner-server";
import { VercelAdapterWebhookHandler } from "@agentmark-ai/ai-sdk-v5-adapter/runner";
import { AgentMarkSDK } from "@agentmark-ai/sdk";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  const webhookPort = Number(
    args.find((a) => a.startsWith("--webhook-port="))?.split("=")[1] ?? 9417,
  );
  const apiServerPort = Number(
    args.find((a) => a.startsWith("--api-server-port="))?.split("=")[1] ?? 9418,
  );
  const apiServerUrl = `http://localhost:${apiServerPort}`;

  // Point the client at the local dev API server before importing it.
  process.env.NODE_ENV = "development";
  process.env.AGENTMARK_BASE_URL = apiServerUrl;

  const { client } = await import("./agentmark.client.js");

  // Export traces to the local API server so they show up in `agentmark dev`.
  const sdk = new AgentMarkSDK({ apiKey: "", appId: "", baseUrl: apiServerUrl });
  sdk.initTracing({ disableBatch: true });

  const handler = new VercelAdapterWebhookHandler(client as never);

  await createWebhookServer({
    port: webhookPort,
    handler,
    apiServerUrl,
    templatesDirectory: path.join(process.cwd(), "agentmark"),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
