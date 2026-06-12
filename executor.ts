import { createExecutor } from "@agentmark-ai/prompt-core";
import { generateText, streamText, generateObject, jsonSchema, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";

// Minimal model resolution — strip an optional "openai/" prefix. Swap in your
// own provider map (anthropic, google, …) keyed off the model name as needed.
const model = (name: string) => openai(name.replace(/^openai\//, ""));

export const executor = createExecutor({
  name: "vercel-ai-sdk",
  text: async (formatted, ctx) => {
    const { text, usage } = await generateText({
      model: model(formatted.text_config.model_name),
      messages: formatted.messages as ModelMessage[],
      abortSignal: ctx.signal,
    });
    return { text, usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } };
  },
  streamText: async function* (formatted, ctx) {
    const result = streamText({
      model: model(formatted.text_config.model_name),
      messages: formatted.messages as ModelMessage[],
      abortSignal: ctx.signal,
    });
    for await (const delta of result.textStream) yield { type: "text-delta" as const, text: delta };
    const usage = await result.usage;
    yield {
      type: "finish" as const,
      reason: "stop",
      usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 },
    };
  },
  object: async (formatted, ctx) => {
    const { object, usage } = await generateObject({
      model: model(formatted.object_config.model_name),
      messages: formatted.messages as ModelMessage[],
      schema: jsonSchema(formatted.object_config.schema),
      abortSignal: ctx.signal,
    });
    return { object, usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } };
  },
});
