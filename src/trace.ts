// Step 5 of the AgentMark setup contract: produce one trace.
//
// A minimal, self-contained script that makes one real LLM call with telemetry
// enabled and ships the trace to AgentMark Cloud. It does NOT load a prompt from
// Cloud, so it works before this repo's prompts are synced to your app.
//
// Run with the env actually loaded:
//   node --env-file=.env --import tsx src/trace.ts
// or: npm run trace
import { tracing } from "./tracing"; // initializes tracing at import time
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

async function main() {
  const { text, usage } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "In one sentence, what is distributed tracing?",
    // REQUIRED for the AI SDK to emit any spans.
    experimental_telemetry: {
      isEnabled: true,
      functionId: "trace-smoke-test",
      metadata: { environment: process.env.NODE_ENV ?? "development" },
    },
  });

  console.log("\n=== Model output ===");
  console.log(text);
  console.log(
    `\n🪙 ${usage.inputTokens} in, ${usage.outputTokens} out, ${usage.totalTokens} total`,
  );

  // Short-lived script: flush + shut down so the span is actually sent.
  await tracing.forceFlush();
  await tracing.shutdown();
  console.log("\n✅ Trace flushed to AgentMark. Check the Dashboard → Traces.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
