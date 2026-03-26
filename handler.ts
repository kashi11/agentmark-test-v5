import { VercelAdapterWebhookHandler } from '@agentmark-ai/ai-sdk-v5-adapter/runner';
import { AgentMarkSDK } from '@agentmark-ai/sdk';

const sdk = new AgentMarkSDK({
  apiKey: process.env.AGENTMARK_API_KEY,
  appId: process.env.AGENTMARK_APP_ID,
});

sdk.initTracing({ disableBatch: true });

export default async function handler(request: any) {
  const adapter = new VercelAdapterWebhookHandler();

  if (request.type === 'prompt-run') {
    return adapter.runPrompt(request);
  }

  if (request.type === 'dataset-run') {
    return adapter.runExperiment(request);
  }

  return { error: 'Unknown request type' };
}
