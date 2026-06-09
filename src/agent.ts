// Runnable example: load a prompt through the AI SDK adapter, run it with the
// Vercel AI SDK, and emit an AgentMark trace.
//
// Run with the env actually loaded (Node does not read .env by itself):
//   node --env-file=.env --import tsx src/agent.ts
// or via the npm script: `npm run agent`.
import "dotenv/config";
import { AgentMarkSDK } from "@agentmark-ai/sdk";
import { generateText } from "ai";
import { client } from "../agentmark.client";

async function main() {
  // --- Tracing setup -------------------------------------------------------
  // registerGlobally: true is REQUIRED for the model-call (generation) span:
  // the AI SDK emits it through the global OpenTelemetry tracer. disableBatch
  // makes spans export immediately, which is what you want in a short-lived
  // script like this one.
  const sdk = new AgentMarkSDK({
    apiKey: process.env.AGENTMARK_API_KEY!,
    appId: process.env.AGENTMARK_APP_ID!,
  });
  const tracer = sdk.initTracing({
    registerGlobally: true,
    disableBatch: true,
  });

  // --- Load + format the prompt -------------------------------------------
  const prompt = await client.loadTextPrompt("greeting.prompt.mdx");
  const input = await prompt.format({
    props: { name: "Alice", interest: "distributed systems" },
    // Opting in to telemetry is what makes the AI SDK emit spans for this call.
    telemetry: {
      isEnabled: true,
      functionId: "greeting-handler",
      metadata: {
        userId: "user-123",
        environment: process.env.NODE_ENV ?? "development",
      },
    },
  });

  // --- Run through the Vercel AI SDK --------------------------------------
  const result = await generateText(input);

  console.log("\n=== Greeting ===");
  console.log(result.text);
  console.log(
    `\n🪙 ${result.usage.inputTokens} in, ${result.usage.outputTokens} out, ${result.usage.totalTokens} total`,
  );

  // --- Flush + shut down (short-lived script only) -------------------------
  await tracer.forceFlush();
  await tracer.shutdown();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
