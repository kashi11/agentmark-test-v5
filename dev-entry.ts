// Development webhook server entry point
// This file is version controlled - customize as needed for your project

import { createWebhookServer } from '@agentmark-ai/cli/runner-server';
import { VercelAdapterWebhookHandler } from '@agentmark-ai/ai-sdk-v5-adapter/runner';
import { AgentMarkSDK } from '@agentmark-ai/sdk';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const webhookPortArg = args.find(arg => arg.startsWith('--webhook-port='));
  const apiServerPortArg = args.find(arg => arg.startsWith('--api-server-port='));

  const webhookPort = webhookPortArg ? parseInt(webhookPortArg.split('=')[1]) : 9417;
  const apiServerPort = apiServerPortArg ? parseInt(apiServerPortArg.split('=')[1]) : 9418;
  const apiServerUrl = `http://localhost:${apiServerPort}`;

  // Set environment for development mode before importing client
  process.env.NODE_ENV = 'development';
  process.env.AGENTMARK_BASE_URL = apiServerUrl;

  // Now import client - it will pick up the dev environment
  const { client } = await import('./agentmark.client.js');

  // Initialize OpenTelemetry tracing to export traces to the API server
  const sdk = new AgentMarkSDK({
    apiKey: '',
    appId: '',
    baseUrl: apiServerUrl,
  });
  sdk.initTracing({ disableBatch: true });

  const handler = new VercelAdapterWebhookHandler(client as any);
  const templatesDirectory = path.join(process.cwd(), 'agentmark');

  await createWebhookServer({
    port: webhookPort,
    handler,
    apiServerUrl,
    templatesDirectory
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
