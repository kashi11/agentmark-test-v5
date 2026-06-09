// Local dev webhook server — `agentmark dev` runs this with tsx.
// Mark this process as development BEFORE the client loads, so the client's
// loader switch picks the local dev server over the cloud.
process.env.NODE_ENV ||= "development";

import { createWebhookServer } from "@agentmark-ai/cli/runner-server";
import { VercelAdapterWebhookHandler } from "@agentmark-ai/ai-sdk-v5-adapter/runner";

async function main() {
  const { client } = await import("./agentmark.client");

  const args = process.argv.slice(2);
  const portArg = args.find((arg) => arg.startsWith("--webhook-port="));
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : 9417;

  const handler = new VercelAdapterWebhookHandler(client);
  await createWebhookServer({ port, handler });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
