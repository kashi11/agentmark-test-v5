export default async function handler(jobRequest: { type: string; data: unknown }) {
  return {
    type: 'prompt-run',
    result: `Echo: received job ${jobRequest.type}`,
    traceId: crypto.randomUUID(),
  };
}
