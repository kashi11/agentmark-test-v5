import {
  createAgentMarkClient,
  VercelAIModelRegistry,
} from "@agentmark-ai/ai-sdk-v5-adapter";
import { ApiLoader } from "@agentmark-ai/loader-api";
import { openai } from "@ai-sdk/openai";

// Local dev: prompts come from `agentmark dev`'s API server (default port 9418).
// Deployed: prompts and datasets come from AgentMark Cloud, using the env vars
// the deployment pipeline injects automatically.
const loader =
  process.env.NODE_ENV === "development"
    ? ApiLoader.local({ baseUrl: "http://localhost:9418" })
    : ApiLoader.cloud({
        apiKey: process.env.AGENTMARK_API_KEY!,
        appId: process.env.AGENTMARK_APP_ID!,
        baseUrl: process.env.AGENTMARK_BASE_URL,
      });

// Map model names referenced in prompt frontmatter (e.g. "openai/gpt-5-mini")
// to real Vercel AI SDK models.
const modelRegistry = new VercelAIModelRegistry();
modelRegistry.registerProviders({ openai });

export const client = createAgentMarkClient({
  loader,
  modelRegistry,
});
