"""Example usage of AgentMark with Pydantic AI.

Run with: python main.py
"""

import asyncio
import json
import os
from pathlib import Path

from agentmark_sdk import AgentMarkSDK
from agentmark_pydantic_ai_v0 import run_text_prompt
from agentmark_client import client

# Initialize tracing - traces will be sent to AgentMark Cloud
# To disable tracing, comment out sdk.init_tracing() below
sdk = AgentMarkSDK(
    api_key=os.environ.get("AGENTMARK_API_KEY", ""),
    app_id=os.environ.get("AGENTMARK_APP_ID", ""),
)
sdk.init_tracing(disable_batch=True)


async def main():
    """Run the party planner prompt."""
    # Load the prompt AST (in production, use the API loader)
    prompt_path = Path("agentmark/party-planner.prompt.mdx.json")

    if not prompt_path.exists():
        print("Prompt file not found. Run 'agentmark build' first.")
        return

    with open(prompt_path) as f:
        ast = json.load(f)

    # Load and format the prompt
    prompt = await client.load_text_prompt(ast)
    params = await prompt.format(props={
        "numberOfGuests": 10,
        "theme": "80s disco",
        "dietaryRestrictions": ["vegetarian", "gluten-free"],
    })

    # Execute the prompt
    print("Running party planner prompt...")
    result = await run_text_prompt(params)

    print("\n" + "=" * 50)
    print("Party Plan:")
    print("=" * 50)
    print(result.output)
    print("\n" + "-" * 50)
    print(f"Tokens used: {result.usage.total_tokens}")


if __name__ == "__main__":
    asyncio.run(main())
