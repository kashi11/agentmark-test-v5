// Direct execution example: load the prompt, format it with props, and call
// the AI SDK with Anthropic Haiku. Run with: `npm run start`
//
// Requires ANTHROPIC_API_KEY in .env (the model call). Run `agentmark dev` in
// another terminal first — the local loader resolves the template from :9418.

import "dotenv/config";
import { generateText } from "ai";

// Select the local (dev-server) loader BEFORE importing the client, since the
// client picks its loader from NODE_ENV at module-evaluation time.
process.env.NODE_ENV ||= "development";

const telemetry = {
  isEnabled: true,
  metadata: { trace_name: "support-agent", session_name: "local-run" },
};

async function main() {
  const { client } = await import("./agentmark.client.js");

  const question = "Do you support Anthropic models?";
  const prompt = await client.loadTextPrompt(
    "support-agent/support-agent.prompt.mdx",
  );
  const vercelInput = await prompt.format({
    props: { question, product: "AgentMark" },
    telemetry,
  });
  const { text } = await generateText(vercelInput);

  console.log("Q:", question);
  console.log("A:", text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
