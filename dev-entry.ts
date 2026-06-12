// Local dev webhook server — `agentmark dev` runs this with tsx.
import { createWebhookServer } from "@agentmark-ai/cli/runner-server";
import { AgentMarkSDK, createWebhookRunner } from "@agentmark-ai/sdk";

async function main() {
  const { client } = await import("./agentmark.client");
  const { executor } = await import("./executor");

  // Local tracing: the runner wires span HOOKS, but spans only export once
  // tracing is initialized. Point the exporter at the local dev API server
  // (unauthenticated — no cloud keys needed); without this, runs work but
  // `agentmark doctor --smoke` and the local trace UI never see a trace.
  new AgentMarkSDK({
    apiKey: "local-dev",
    appId: "local-dev",
    baseUrl: process.env.AGENTMARK_DEV_SERVER ?? "http://localhost:9418",
  }).initTracing({ disableBatch: true });

  // The runner shares your app client — loader AND evals come from it.
  const runner = createWebhookRunner({ client, executor });

  const args = process.argv.slice(2);
  const portArg = args.find((arg) => arg.startsWith("--webhook-port="));
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : 9417;

  // A WebhookRunner already satisfies the webhook server's handler contract.
  await createWebhookServer({ handler: runner, port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
