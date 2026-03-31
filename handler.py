"""AgentMark handler for managed cloud deployments."""

import os
from agentmark.prompt_core import ApiLoader
from agentmark_pydantic_ai_v0 import (
    PydanticAIWebhookHandler,
    create_pydantic_ai_client,
    PydanticAIModelRegistry,
)

# Register the model providers your prompts use
model_registry = PydanticAIModelRegistry()
model_registry.register_providers({
    "openai": "openai",
    "anthropic": "anthropic",
})

# API loader for cloud deployment — fetches from AgentMark gateway
loader = ApiLoader.cloud()

# Create the client
client = create_pydantic_ai_client(
    model_registry=model_registry,
    tools=[],
    loader=loader,
)

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
