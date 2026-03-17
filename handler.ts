import { defineHandler } from '@agentmark-ai/connect';

export default defineHandler({
  handler: async (jobRequest) => {
    // Simple echo handler for testing managed code deployments
    return {
      type: 'prompt-run',
      result: `Echo: received job ${jobRequest.type}`,
      traceId: crypto.randomUUID(),
    };
  },
});
