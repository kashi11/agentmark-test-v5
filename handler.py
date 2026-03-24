"""AgentMark handler for Python managed deployments."""

import os
import json


async def handler(request):
    """Handle prompt-run and dataset-run requests."""
    req_type = request.get("type")
    data = request.get("data", {})

    if req_type == "prompt-run":
        # Simple echo handler for testing
        ast = data.get("ast", {})
        return {
            "type": "text",
            "result": {
                "text": "Hello from Python handler!",
                "usage": {"promptTokens": 10, "completionTokens": 5, "totalTokens": 15},
            },
        }

    if req_type == "dataset-run":
        # Return a simple async generator for streaming
        async def stream():
            items = [
                {"index": 0, "input": "test1", "output": "result1", "tokens": 10},
                {"index": 1, "input": "test2", "output": "result2", "tokens": 10},
            ]
            for item in items:
                yield json.dumps(item) + "\n"

        class StreamResult:
            def __init__(self):
                self.stream = stream()
                self.streamHeaders = {"AgentMark-Streaming": "true"}

        return StreamResult()

    raise ValueError(f"Unknown request type: {req_type}")
