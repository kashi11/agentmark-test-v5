import {
  createAgentMarkClient,
  VercelAIModelRegistry,
} from "@agentmark-ai/ai-sdk-v5-adapter";
import { ApiLoader } from "@agentmark-ai/loader-api";
import type { EvalFunction } from "@agentmark-ai/prompt-core";
import { openai } from "@ai-sdk/openai";
import { tool, type Tool } from "ai";
import { z } from "zod";

const asText = (o: unknown) =>
  typeof o === "string" ? o : JSON.stringify(o ?? "");

// During an experiment an eval receives the rendered prompt as `input` (a
// messages array), the model's `output`, and any `expectedOutput`. Pull the
// user-turn text so an eval can reason about what was actually asked.
const userText = (input: unknown): string => {
  if (Array.isArray(input)) {
    const u = [...input].reverse().find((m: any) => m?.role === "user");
    return asText(u?.content);
  }
  return asText(input);
};

// Eval functions score a prompt's output during experiments. They're connected
// to score configs (declared in agentmark.json) by name, referenced from a
// prompt's `test_settings.evals`, and surfaced to the Dashboard via `get-evals`.
const evals: Record<string, EvalFunction> = {
  // Did the greeting address the person it was asked to greet? The recipient
  // is parsed from the user turn ("Say hello to <name> …").
  mentions_name: ({ input, output }) => {
    const recipient = /hello to (\w+)/i.exec(userText(input))?.[1] ?? "";
    const passed = recipient
      ? asText(output).toLowerCase().includes(recipient.toLowerCase())
      : false;
    return {
      passed,
      score: passed ? 1 : 0,
      reason: recipient
        ? `${passed ? "Mentions" : "Does not mention"} "${recipient}"`
        : "No recipient found in prompt",
    };
  },
  // The prompt asks for at most two sentences — keep it honest.
  two_sentences_max: ({ output }) => {
    const sentences = (asText(output).match(/[.!?]+(\s|$)/g) ?? []).length;
    const passed = sentences >= 1 && sentences <= 2;
    return {
      passed,
      score: passed ? 1 : 0,
      reason: `${sentences} sentence(s)`,
    };
  },
};

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

// Map model names referenced in prompt frontmatter to real Vercel AI SDK models.
// `registerProviders` auto-resolves text/object/tool models written as
// "openai/<model>" (e.g. "openai/gpt-5-mini"). Image and speech models need
// the dedicated openai.image()/openai.speech() factories, so they're registered
// explicitly by bare name (referenced as `dall-e-3` / `tts-1-hd` in frontmatter).
const modelRegistry = new VercelAIModelRegistry();
modelRegistry.registerProviders({ openai });
modelRegistry
  .registerModels(["gpt-image-1"], (name) => openai.image(name))
  .registerModels(["tts-1-hd"], (name) => openai.speech(name));

// Tools referenced by name in a prompt's `text_config.tools` must be registered
// here. AI SDK v5 tools use `inputSchema` (Zod); `parameters` is the v4 name.
// Typed as Record<string, Tool> so each tool's specific input/output generics
// don't leak into the adapter's (and other prompts') param types.
const tools: Record<string, Tool> = {
  get_weather: tool({
    description: "Get the current weather for a city.",
    inputSchema: z.object({
      city: z.string().describe("City name, e.g. Lisbon"),
    }),
    // Demo implementation — deterministic fake data instead of a real API call.
    execute: async ({ city }) => ({
      city,
      temperatureC: 19,
      condition: "light rain",
      chanceOfRain: 0.6,
    }),
  }),
};

export const client = createAgentMarkClient({
  loader,
  modelRegistry,
  evals,
  tools,
});
