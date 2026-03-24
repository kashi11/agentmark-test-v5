"""AgentMark client configuration.

This file configures the AgentMark client with Pydantic AI adapter.
Customize the model registry and tools as needed.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

from agentmark.prompt_core import FileLoader
from agentmark_pydantic_ai_v0 import (
    create_pydantic_ai_client,
    create_default_model_registry,
)

# Load environment variables
load_dotenv()

# Configure model registry with default mappings
# Supports: gpt-*, claude-*, gemini-*, etc.
model_registry = create_default_model_registry()

# Define tools as native pydantic-ai Tool objects or callables
# Example:
# def search(query: str) -> str:
#     return f"Search results for: {query}"
# tools = [search]
tools = []

# Create file loader for local development
# Uses the project root as base directory for resolving relative paths
project_root = Path(__file__).parent.resolve()
loader = FileLoader(base_dir=str(project_root))

# Create the client
client = create_pydantic_ai_client(
    model_registry=model_registry,
    tools=tools,
    loader=loader,
)

__all__ = ["client"]
