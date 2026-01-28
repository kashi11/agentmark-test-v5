// agentmark.client.ts
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });
import { createAgentMarkClient, VercelAIModelRegistry, VercelAIToolRegistry, EvalRegistry } from "@agentmark-ai/ai-sdk-v5-adapter";
import { ApiLoader } from "@agentmark-ai/loader-api";
import AgentMarkTypes, { Tools } from './agentmark.types';
import { openai } from '@ai-sdk/openai';
import { classificationEval } from './classification-eval';


function createModelRegistry() {
  const modelRegistry = new VercelAIModelRegistry()
    .registerModels(["gpt-4o"], (name: string) => openai(name))
    .registerModels(["dall-e-3"], (name: string) => openai.image(name))
    .registerModels(["tts-1-hd"], (name: string) => openai.speech(name));
  return modelRegistry;
}

function createToolRegistry() {
  const toolRegistry = new VercelAIToolRegistry<Tools>()
    .register('search_knowledgebase', async ({ query }) => {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return all three knowledge base articles
      // The LLM will select the relevant one based on the query
      return {
        articles: [
          { topic: 'shipping', content: 'Standard shipping takes 3–5 business days.' },
          { topic: 'warranty', content: 'All products include a 1-year limited warranty.' },
          { topic: 'returns', content: 'You can return items within 30 days of delivery.' }
        ]
      };
    });
  return toolRegistry;
}

function createEvalRegistry() {
  const evalRegistry = new EvalRegistry()
    .register('exact_match_json', ({ output, expectedOutput }) => {
      if (!expectedOutput) {
        return { score: 0, label: 'error', reason: 'No expected output provided', passed: false };
      }
      try {
        const ok = JSON.stringify(output) === JSON.stringify(JSON.parse(expectedOutput));
        return {
          score: ok ? 1 : 0,
          label: ok ? 'correct' : 'incorrect',
          reason: ok ? 'Exact match' : 'Mismatch',
          passed: ok
        };
      } catch (e) {
        return { score: 0, label: 'error', reason: 'Failed to parse expected output as JSON', passed: false };
      }
    }).register('llm_classification_judge', classificationEval);
  return evalRegistry;
}

function createClient() {
  // ApiLoader works for both development and production
  // - Development: 'agentmark dev' sets AGENTMARK_BASE_URL to localhost
  // - Production: Set AGENTMARK_API_KEY and AGENTMARK_APP_ID for cloud
  const loader = process.env.NODE_ENV === 'development'
    ? ApiLoader.local({ baseUrl: process.env.AGENTMARK_BASE_URL || 'http://localhost:9418' })
    : ApiLoader.cloud({
        apiKey: process.env.AGENTMARK_API_KEY!,
        appId: process.env.AGENTMARK_APP_ID!,
      });
  const modelRegistry = createModelRegistry();
  const toolRegistry = createToolRegistry();
  const evalRegistry = createEvalRegistry();
  return createAgentMarkClient<AgentMarkTypes, typeof toolRegistry>({ loader, modelRegistry, toolRegistry, evalRegistry });
}

export const client = createClient();
