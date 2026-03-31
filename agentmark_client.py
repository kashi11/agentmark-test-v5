"""AgentMark client configuration.

This file configures the AgentMark client with Pydantic AI adapter.
Customize the model registry and tools as needed.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

from agentmark.prompt_core import ApiLoader
from agentmark_pydantic_ai_v0 import (
    create_pydantic_ai_client,
    PydanticAIModelRegistry,
)

# Load environment variables
load_dotenv()

# Register the model providers your prompts use.
# This maps "openai/gpt-4o" in prompt files to "openai:gpt-4o" for Pydantic AI.
model_registry = PydanticAIModelRegistry()
model_registry.register_providers({
    "openai": "openai",
    "anthropic": "anthropic",
})

# Define tools as native pydantic-ai Tool objects or callables
def search_knowledgebase(query: str) -> str:
    """Search the company knowledgebase for information about shipping, warranty, and returns."""
    # Stub implementation — replace with a real lookup in production
    kb = {
        "shipping": "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days.",
        "warranty": "All products come with a 1-year limited warranty covering defects in materials and workmanship.",
        "returns": "Items can be returned within 30 days of purchase for a full refund. Items must be in original condition.",
    }
    query_lower = query.lower()
    results = [v for k, v in kb.items() if k in query_lower]
    return " ".join(results) if results else f"No knowledgebase results found for: {query}"

tools = [search_knowledgebase]

# API loader for cloud deployment — fetches datasets from the AgentMark gateway
loader = ApiLoader.cloud()

# Create the client
client = create_pydantic_ai_client(
    model_registry=model_registry,
    tools=tools,
    loader=loader,
)

__all__ = ["client"]
