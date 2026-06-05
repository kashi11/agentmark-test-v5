import { anthropic } from "@ai-sdk/anthropic";
import { ApiLoader } from "@agentmark-ai/loader-api";
import {
  createAgentMarkClient,
  VercelAIModelRegistry,
} from "@agentmark-ai/ai-sdk-v5-adapter";
import AgentmarkTypes from "./agentmark.types";
import { evals } from "./evals";

/**
 * Model registry: maps a prompt's `model_name` to a concrete AI SDK model.
 *
 * The `/^claude/` pattern lets prompts use the bare canonical IDs from the
 * AgentMark model registry (e.g. `claude-haiku-4-5`) and routes them to the
 * AI SDK Anthropic provider. `registerProviders` additionally enables the
 * `anthropic/<model>` slash form. See @ai-sdk/anthropic for valid model IDs.
 */
function createModelRegistry() {
  return new VercelAIModelRegistry()
    .registerModels(/^claude/, (name) => anthropic(name))
    .registerProviders({ anthropic });
}

/**
 * Loader resolves prompt templates.
 * - Development (`agentmark dev`): reads from the local API server on :9418.
 * - Production: reads deployed templates from AgentMark Cloud.
 */
function createLoader() {
  return process.env.NODE_ENV === "development"
    ? ApiLoader.local({
        baseUrl: process.env.AGENTMARK_BASE_URL || "http://localhost:9418",
      })
    : ApiLoader.cloud({
        apiKey: process.env.AGENTMARK_API_KEY!,
        appId: process.env.AGENTMARK_APP_ID!,
        baseUrl: process.env.AGENTMARK_BASE_URL,
      });
}

export const client = createAgentMarkClient<AgentmarkTypes>({
  loader: createLoader(),
  modelRegistry: createModelRegistry(),
  evals,
});
