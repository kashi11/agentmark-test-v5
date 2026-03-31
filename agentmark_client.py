"""AgentMark client configuration.

This file configures the AgentMark client with Pydantic AI adapter.
Customize the model registry, tools, and eval registry as needed.
"""

import json
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
    """Search the knowledgebase for relevant information."""
    return "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days."

tools = [search_knowledgebase]


# Eval registry — define evaluation functions for experiments
def exact_match_json(params):
    """Check if output matches expected output exactly."""
    output = params.get("output")
    expected_output = params.get("expectedOutput")
    if not expected_output:
        return {"score": 0, "label": "error", "reason": "No expected output provided", "passed": False}
    try:
        actual = json.loads(output) if isinstance(output, str) else output
        expected = json.loads(expected_output) if isinstance(expected_output, str) else expected_output
        ok = actual == expected
        return {
            "score": 1 if ok else 0,
            "label": "correct" if ok else "incorrect",
            "reason": "Exact match" if ok else "Mismatch",
            "passed": ok,
        }
    except (json.JSONDecodeError, TypeError):
        return {"score": 0, "label": "error", "reason": "Failed to parse JSON", "passed": False}

eval_registry = {
    "exact_match_json": exact_match_json,
}

# API loader for cloud deployment — fetches datasets from the AgentMark gateway
loader = ApiLoader.cloud()

# Create the client
client = create_pydantic_ai_client(
    model_registry=model_registry,
    tools=tools,
    eval_registry=eval_registry,
    loader=loader,
)

__all__ = ["client"]
