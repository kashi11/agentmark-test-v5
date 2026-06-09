// AgentMark Cloud deployment entry point. The deployment pipeline bundles this
// file (esbuild) and wraps it in a managed HTTP server. Each Dashboard run
// (playground or experiment) arrives as one { type, data } event.
//
// We inline the webhook dispatch instead of importing `handleWebhookRequest`
// from `@agentmark-ai/cli/runner-server`. That CLI subpath is runtime code, but
// the `@agentmark-ai/cli` package also pulls a dev-tooling dependency tree
// (next, @mui/*, better-sqlite3) that breaks the Cloud production install. The
// dispatch itself is tiny and stable, so the deployed bundle depends only on the
// lightweight adapter. (`dev-entry.ts` still uses the CLI for local `agentmark dev`.)
//
// IMPORTANT: this side-effect import wires AgentMark tracing at app startup
// (sdk.initTracing({ registerGlobally: true })). It MUST run before any model
// call. Without it, the managed handler has no registered global OTel tracer, so
// the AI SDK's model spans and experiment spans silently go to a no-op tracer and
// never reach the gateway — the experiment runs, but no traces appear in the UI.
// Keep it first so the provider is registered before the client/adapter load.
import "./src/tracing";
import { VercelAdapterWebhookHandler } from "@agentmark-ai/ai-sdk-v5-adapter/runner";
import { client } from "./agentmark.client";

export type WebhookRequest = { type?: string; data?: any };

const webhookHandler = new VercelAdapterWebhookHandler(client);

// Forward-compatible source of registered eval names for the `get-evals`
// control-plane job. Newer prompt-core surfaces `client.getEvalNames()`; older
// builds (what's pinned here) keep them in the private `_evalRegistry`. Prefer
// the official accessor when present.
function getEvalNames(): string[] {
  const c = client as any;
  if (typeof c.getEvalNames === "function") return c.getEvalNames();
  return Object.keys(c._evalRegistry ?? {});
}

export default async function handler(request: WebhookRequest) {
  const { type, data } = request ?? {};

  // Control-plane job: the Dashboard's New Experiment dialog asks which evals
  // this deployed app can run, to populate its "Evaluations" multi-select.
  // No prompt AST involved. Matches the shared cross-language wire contract:
  // { type: "evals", result: <JSON array of sorted names>, traceId: "" }.
  if (type === "get-evals") {
    const names = [...getEvalNames()].sort();
    // Return the FLAT control-plane payload — NOT wrapped in the
    // { type:'json', data, status } envelope that prompt-run/dataset-run use.
    // The Dashboard's "Evaluations" picker dispatches get-evals straight to the
    // gateway and reads the machine's response as-is (the Durable Object forwards
    // the body without unwrapping `.data`). It expects exactly:
    //   { type: 'evals', result: <JSON string of names>, traceId: string }
    // A wrapped { type:'json', ... } makes the route see type !== 'evals' and
    // return an empty list — which is why the evals never appeared.
    return { type: "evals", result: JSON.stringify(names), traceId: "" };
  }

  if (type !== "prompt-run" && type !== "dataset-run") {
    return {
      type: "error",
      error: "Unknown event type",
      details: `Expected event.type to be 'prompt-run', 'dataset-run', or 'get-evals', got: ${type ?? "undefined"}`,
      status: 400,
    };
  }
  if (!data?.ast || typeof data.ast !== "object") {
    return {
      type: "error",
      error: "Missing AST object",
      details: "The request must include the prompt AST in data.ast",
      status: 400,
    };
  }

  if (type === "prompt-run") {
    const response: any = await webhookHandler.runPrompt(data.ast, {
      shouldStream: data.options?.shouldStream,
      customProps: data.customProps,
    });
    if (response?.type === "stream") {
      return {
        type: "stream",
        stream: response.stream,
        headers: response.streamHeader || { "AgentMark-Streaming": "true" },
        traceId: response.traceId,
      };
    }
    return { type: "json", data: response, status: 200 };
  }

  // dataset-run — always streams.
  try {
    const response: any = await webhookHandler.runExperiment(
      data.ast,
      data.experimentId ?? "local-experiment",
      {
        datasetPath: data.datasetPath,
        sampling: data.sampling,
        concurrency: data.concurrency,
        experimentKey: data.experimentKey,
        sourceTreeHash: data.sourceTreeHash,
      },
    );
    if (response?.stream) {
      return {
        type: "stream",
        stream: response.stream,
        headers: response.streamHeaders || { "AgentMark-Streaming": "true" },
      };
    }
    return {
      type: "error",
      error: "Expected stream from dataset-run",
      details: "Dataset execution should return a streaming response",
      status: 500,
    };
  } catch (e: any) {
    return {
      type: "error",
      error: e?.message || String(e),
      details: "An error occurred while running the experiment.",
      status: 500,
    };
  }
}
