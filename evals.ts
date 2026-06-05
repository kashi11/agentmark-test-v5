import type { EvalFunction } from "@agentmark-ai/prompt-core";

/**
 * `concise` — a deterministic, code-based eval that enforces the prompt's own
 * contract ("keep replies under 4 sentences"). Counts sentence-terminating
 * punctuation and scores 1 when the reply has 1–4 sentences, 0 otherwise.
 *
 * Heuristic, not a parser: abbreviations ("e.g.") and decimals can inflate the
 * count. That's an intentional trade-off — cheap and good enough to catch a
 * model that starts rambling. Swap in a real sentence segmenter if you need
 * precision.
 */
const concise: EvalFunction = ({ output }) => {
  const text = typeof output === "string" ? output : JSON.stringify(output);
  const sentences = (text.match(/[.!?]+(?:\s|$)/g) ?? []).length;
  const passed = sentences >= 1 && sentences <= 4;
  return {
    score: passed ? 1 : 0,
    passed,
    label: passed ? "concise" : "too_long",
    reason: `Detected ${sentences} sentence(s); limit is 4.`,
  };
};

export const evals = { concise };
