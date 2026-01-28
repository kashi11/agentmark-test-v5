import { generateObject } from "ai";
import { client } from "./agentmark.client";

export const classificationEval =async ({expectedOutput, output}: any) => {
    if (!expectedOutput) {
        return { score: 0, label: 'error', reason: 'No expected output provided', passed: false };
      }
      try {
        const judgePrompt = await client.loadObjectPrompt('classification-judge.prompt.mdx');
        const formatted = await judgePrompt.format({
          props: {
            model_output: String(output),
            expected_classification: expectedOutput
          }
        });
        const { object: result } = await generateObject(formatted);
        return {
          score: result.correct ? 1 : 0,
          label: result.correct ? 'correct' : 'incorrect',
          reason: result.reason,
          passed: result.correct
        };
      } catch (e) {
        return { score: 0, label: 'error', reason: `Judge eval failed: ${e}`, passed: false };
      }
}