import { createAgentMark } from "@agentmark-ai/prompt-core";
import { ApiLoader } from "@agentmark-ai/prompt-core/loader-api";
import type AgentmarkTypes from "./agentmark.types";

// Local dev (no API key): prompts come from `agentmark dev`'s API server.
// Linked to cloud (API key present): prompts come from AgentMark Cloud.
const loader = process.env.AGENTMARK_API_KEY
  ? ApiLoader.cloud({
      apiKey: process.env.AGENTMARK_API_KEY,
      appId: process.env.AGENTMARK_APP_ID!,
      baseUrl: process.env.AGENTMARK_BASE_URL,
    })
  : ApiLoader.local({ baseUrl: "http://localhost:9418" });

// Evals live on the client. The webhook runner sources them from here, so
// they RUN in cloud experiments and LIST in the dashboard's New Experiment
// dialog. Start empty and add as you go.
export const client = createAgentMark<AgentmarkTypes>({
  loader,
  evals: {
    exact_match: ({ output, expectedOutput }) => ({
      score: output === expectedOutput ? 1 : 0,
    }),
  },
});
