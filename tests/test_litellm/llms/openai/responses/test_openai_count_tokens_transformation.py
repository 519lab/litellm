import os
import sys

import pytest

sys.path.insert(
    0, os.path.abspath("../../../../..")
)  # Adds the parent directory to the system path
from litellm.llms.openai.responses.count_tokens.token_counter import OpenAITokenCounter
from litellm.llms.openai.responses.count_tokens.transformation import (
    OpenAICountTokensConfig,
)


def test_transform_basic_request():
    """Test basic request with model and input."""
    config = OpenAICountTokensConfig()

    result = config.transform_request_to_count_tokens(
        model="gpt-4o",
        input="Hello, how are you?",
    )

    assert result == {
        "model": "gpt-4o",
        "input": "Hello, how are you?",
    }


def test_transform_with_list_input():
    """Test request with list input format."""
    config = OpenAICountTokensConfig()

    input_items = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
    ]

    result = config.transform_request_to_count_tokens(
        model="gpt-4o",
        input=input_items,
    )

    assert result["model"] == "gpt-4o"
    assert result["input"] == input_items


def test_transform_includes_instructions():
    """Test that instructions are included when provided."""
    config = OpenAICountTokensConfig()

    result = config.transform_request_to_count_tokens(
        model="gpt-4o",
        input="Hello",
        instructions="You are a helpful assistant.",
    )

    assert result["instructions"] == "You are a helpful assistant."
    assert result["model"] == "gpt-4o"
    assert result["input"] == "Hello"


def test_transform_includes_tools():
    """Test that tools are included when provided."""
    config = OpenAICountTokensConfig()

    tools = [
        {
            "type": "function",
            "name": "get_weather",
            "description": "Get weather",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
            },
        }
    ]

    result = config.transform_request_to_count_tokens(
        model="gpt-4o",
        input="What's the weather?",
        tools=tools,
    )

    assert result["tools"] == tools


def test_transform_no_instructions_no_tools():
    """Test that None values are not included."""
    config = OpenAICountTokensConfig()

    result = config.transform_request_to_count_tokens(
        model="gpt-4o",
        input="Hello",
        instructions=None,
        tools=None,
    )

    assert "instructions" not in result
    assert "tools" not in result


def test_messages_to_responses_input_basic():
    """Test converting basic chat messages to Responses API input format."""
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
    ]

    input_items, instructions = OpenAICountTokensConfig.messages_to_responses_input(
        messages
    )

    assert len(input_items) == 3
    assert input_items[0] == {"role": "user", "content": "Hello"}
    assert input_items[1] == {"role": "assistant", "content": "Hi there!"}
    assert input_items[2] == {"role": "user", "content": "How are you?"}
    assert instructions is None


def test_messages_to_responses_input_with_system():
    """Test that system messages are extracted as instructions."""
    messages = [
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hello"},
    ]

    input_items, instructions = OpenAICountTokensConfig.messages_to_responses_input(
        messages
    )

    assert len(input_items) == 1
    assert input_items[0] == {"role": "user", "content": "Hello"}
    assert instructions == "You are helpful."


def test_messages_to_responses_input_with_developer():
    """Test that developer messages are extracted as instructions."""
    messages = [
        {"role": "developer", "content": "Be concise."},
        {"role": "user", "content": "Hello"},
    ]

    input_items, instructions = OpenAICountTokensConfig.messages_to_responses_input(
        messages
    )

    assert len(input_items) == 1
    assert instructions == "Be concise."


def test_messages_to_responses_input_with_tool():
    """Test that tool messages are converted to function_call_output."""
    messages = [
        {"role": "user", "content": "What's the weather?"},
        {"role": "tool", "content": "72°F", "tool_call_id": "call_123"},
    ]

    input_items, instructions = OpenAICountTokensConfig.messages_to_responses_input(
        messages
    )

    assert len(input_items) == 2
    assert input_items[1] == {
        "type": "function_call_output",
        "call_id": "call_123",
        "output": "72°F",
    }


def test_validate_request_valid():
    """Test that valid requests pass validation."""
    config = OpenAICountTokensConfig()
    config.validate_request(model="gpt-4o", input="Hello")


def test_validate_request_missing_model():
    """Test that missing model raises ValueError."""
    config = OpenAICountTokensConfig()
    try:
        config.validate_request(model="", input="Hello")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "model" in str(e)


def test_validate_request_missing_input():
    """Test that missing input raises ValueError."""
    config = OpenAICountTokensConfig()
    try:
        config.validate_request(model="gpt-4o", input="")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "input" in str(e)


def test_get_endpoint_default():
    """Test default endpoint URL."""
    config = OpenAICountTokensConfig()
    assert (
        config.get_openai_count_tokens_endpoint()
        == "https://api.openai.com/v1/responses/input_tokens"
    )


def test_get_endpoint_custom_base():
    """Test custom API base URL."""
    config = OpenAICountTokensConfig()
    assert (
        config.get_openai_count_tokens_endpoint("https://custom.api.com/v1")
        == "https://custom.api.com/v1/responses/input_tokens"
    )


def test_get_required_headers():
    """Test required headers include Authorization."""
    config = OpenAICountTokensConfig()
    headers = config.get_required_headers("sk-test-key")

    assert headers["Authorization"] == "Bearer sk-test-key"
    assert headers["Content-Type"] == "application/json"


_AGENT_SCHEMA = {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}
_AGENT_TOOLS = [{"name": "Read", "description": "Read a file", "input_schema": _AGENT_SCHEMA}]
_AGENT_MESSAGES = [
    {"role": "user", "content": "Fix the failing test"},
    {
        "role": "assistant",
        "content": [
            {"type": "text", "text": "Reading the file."},
            {"type": "tool_use", "id": "toolu_1", "name": "Read", "input": {"path": "/src/app.py"}},
        ],
    },
    {
        "role": "user",
        "content": [{"type": "tool_result", "tool_use_id": "toolu_1", "content": "def add(a, b): return a - b"}],
    },
]


class _RecordingHandler:
    def __init__(self) -> None:
        self.requests: list[dict] = []

    async def handle_count_tokens_request(self, **kwargs):
        self.requests.append(kwargs)
        return {"input_tokens": 4981}


def test_is_anthropic_request_detection():
    config = OpenAICountTokensConfig
    openai_messages = [
        {"role": "system", "content": "be brief"},
        {"role": "assistant", "content": None, "tool_calls": [{"id": "c1", "function": {"name": "f", "arguments": "{}"}}]},
        {"role": "tool", "tool_call_id": "c1", "content": "ok"},
    ]

    assert config.is_anthropic_request(_AGENT_MESSAGES, None, None) is True
    assert config.is_anthropic_request([{"role": "user", "content": "hi"}], _AGENT_TOOLS, None) is True
    assert config.is_anthropic_request([{"role": "user", "content": "hi"}], None, "be brief") is True
    assert config.is_anthropic_request(openai_messages, None, None) is False


def test_anthropic_agent_turns_translate_to_counted_responses_items():
    """tool_use / tool_result turns and Anthropic tools must reach /input_tokens in countable form (#1)."""
    input_items, instructions, tools = OpenAICountTokensConfig.to_responses_count_request(
        model="qwen", messages=_AGENT_MESSAGES, tools=_AGENT_TOOLS, system="You are a coding agent."
    )

    item_types = [item.get("type") for item in input_items]
    assert "function_call" in item_types
    function_call_output = next(item for item in input_items if item.get("type") == "function_call_output")
    assert function_call_output["call_id"] == "toolu_1"
    assert "return a - b" in str(function_call_output["output"])
    assert instructions == "You are a coding agent."
    assert tools == [{"type": "function", "name": "Read", "description": "Read a file", "parameters": _AGENT_SCHEMA}]


def test_openai_messages_keep_chat_translation():
    messages = [{"role": "system", "content": "be brief"}, {"role": "user", "content": "hi"}]
    chat_tools = [{"type": "function", "function": {"name": "f", "parameters": {}}}]

    input_items, instructions, tools = OpenAICountTokensConfig.to_responses_count_request(
        model="gpt-4o", messages=messages, tools=chat_tools, system=None
    )

    assert input_items == [{"role": "user", "content": "hi"}]
    assert instructions == "be brief"
    assert tools == chat_tools


@pytest.mark.asyncio
async def test_token_counter_sends_translated_anthropic_request():
    handler = _RecordingHandler()
    counter = OpenAITokenCounter(handler=handler)

    result = await counter.count_tokens(
        model_to_use="qwen",
        messages=_AGENT_MESSAGES,
        contents=None,
        deployment={"litellm_params": {"api_key": "none", "api_base": "http://127.0.0.1:56669/v1"}},
        tools=_AGENT_TOOLS,
        system="You are a coding agent.",
    )

    assert result is not None and result.total_tokens == 4981
    sent = handler.requests[0]
    assert sent["instructions"] == "You are a coding agent."
    assert sent["tools"][0]["parameters"] == _AGENT_SCHEMA
    assert any(item.get("type") == "function_call_output" for item in sent["input"])
