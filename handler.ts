import { VercelAdapterWebhookHandler } from '@agentmark-ai/ai-sdk-v5-adapter/runner';
import { AgentMarkSDK } from '@agentmark-ai/sdk';
import { client } from './agentmark.client';

// Initialize tracing — sends traces to AgentMark Cloud
const sdk = new AgentMarkSDK({
  apiKey: process.env.AGENTMARK_API_KEY ?? '',
  appId: process.env.AGENTMARK_APP_ID ?? '',
  baseUrl: process.env.AGENTMARK_BASE_URL,
});
sdk.initTracing({ disableBatch: true });

const adapter = new VercelAdapterWebhookHandler(client as any);

export default async function handler(request: {
  type: 'prompt-run' | 'dataset-run' | 'get-evals';
  data: {
    ast?: any;
    customProps?: Record<string, unknown>;
    options?: { shouldStream?: boolean };
    experimentId?: string;
    datasetPath?: string;
  };
}) {
  if (request.type === 'get-evals') {
    return {
      type: 'evals',
      result: JSON.stringify(Object.keys(client.getEvalRegistry())),
      traceId: '',
    };
  }

  if (request.type === 'prompt-run') {
    return adapter.runPrompt(request.data.ast, {
      shouldStream: request.data.options?.shouldStream,
      customProps: request.data.customProps,
    });
  }

  if (request.type === 'dataset-run') {
    return adapter.runExperiment(
      request.data.ast,
      request.data.experimentId ?? '',
      request.data.datasetPath,
    );
  }

  throw new Error(`Unknown request type: ${request.type}`);
}
