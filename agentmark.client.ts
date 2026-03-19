// agentmark.client.ts
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });
import { createAgentMarkClient, VercelAIModelRegistry } from "@agentmark-ai/ai-sdk-v5-adapter";
import type { EvalRegistry } from "@agentmark-ai/ai-sdk-v5-adapter";
import { ApiLoader } from "@agentmark-ai/loader-api";
import AgentMarkTypes from './agentmark.types';
import { openai } from '@ai-sdk/openai';
import { tool } from 'ai';
import type { Tool } from 'ai';
import { z } from 'zod';


function createModelRegistry() {
  const modelRegistry = new VercelAIModelRegistry()
    .registerProviders({ openai });
  return modelRegistry;
}

function createTools(): Record<string, Tool> {
  return {
    search_knowledgebase: tool({
      description: 'Search the knowledge base for relevant articles',
      inputSchema: z.object({ query: z.string().describe('The search query') }),
      execute: async ({ query }) => {
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
      },
    }),
  };
}

const evalRegistry: EvalRegistry = {
  exact_match_json: ({ output, expectedOutput }) => {
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
  },
};

function createClient() {
  // ApiLoader works for both development and production
  // - Development: 'agentmark dev' sets AGENTMARK_BASE_URL to localhost
  // - Production: Set AGENTMARK_API_KEY and AGENTMARK_APP_ID for cloud
  const loader = process.env.NODE_ENV === 'development'
    ? ApiLoader.local({ baseUrl: process.env.AGENTMARK_BASE_URL || 'http://localhost:9418' })
    : ApiLoader.cloud({
        apiKey: process.env.AGENTMARK_API_KEY!,
        appId: process.env.AGENTMARK_APP_ID!,
        baseUrl: process.env.AGENTMARK_BASE_URL,
      });
  const modelRegistry = createModelRegistry();
  const tools = createTools();
  return createAgentMarkClient<AgentMarkTypes>({ loader, modelRegistry, tools, evalRegistry });
}

export const client = createClient();
