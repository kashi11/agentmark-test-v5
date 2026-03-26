import { client } from './agentmark.client';

export default {
  async handler(request: any) {
    const { type, data } = request;
    
    if (type === 'prompt-run') {
      const { ast } = data;
      const result = await client.runFromAST(ast);
      return result;
    }
    
    return { error: 'Unknown request type' };
  }
};