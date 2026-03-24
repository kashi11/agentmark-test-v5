"""AgentMark handler for managed cloud deployments.

This file is used by the AgentMark platform to execute prompts and experiments
on deployed infrastructure. It mirrors the TypeScript handler.ts pattern.
"""

import os

from agentmark_sdk import AgentMarkSDK
from agentmark_pydantic_ai_v0 import PydanticAIWebhookHandler
from agentmark_client import client

# Initialize tracing
sdk = AgentMarkSDK(
    api_key=os.environ.get("AGENTMARK_API_KEY", ""),
    app_id=os.environ.get("AGENTMARK_APP_ID", ""),
    base_url=os.environ.get("AGENTMARK_BASE_URL"),
)
sdk.init_tracing(disable_batch=True)

adapter = PydanticAIWebhookHandler(client)


async def handler(request: dict):
    """Handle prompt-run and dataset-run requests from the platform."""
    req_type = request.get("type")
    data = request.get("data", {})

    if req_type == "prompt-run":
        return await adapter.run_prompt(data["ast"], {
            "shouldStream": data.get("options", {}).get("shouldStream", False),
            "customProps": data.get("customProps"),
        })

    if req_type == "dataset-run":
        return await adapter.run_experiment(
            data["ast"],
            data.get("experimentId", ""),
            data.get("datasetPath"),
        )

    raise ValueError(f"Unknown request type: {req_type}")
