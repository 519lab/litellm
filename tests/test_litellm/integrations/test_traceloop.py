from datetime import datetime, timedelta
from types import SimpleNamespace

from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from litellm.integrations.traceloop import TraceloopLogger


def test_log_event_records_semconv_ai_attributes():
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))

    logger = TraceloopLogger.__new__(TraceloopLogger)
    logger.tracer_wrapper = SimpleNamespace(get_tracer=lambda: provider.get_tracer("test"))

    start = datetime(2026, 1, 1)
    logger.log_event(
        kwargs={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "hi"}],
            "optional_params": {"top_p": 0.5},
        },
        response_obj={
            "model": "gpt-4o-2024-08-06",
            "usage": {"total_tokens": 3, "completion_tokens": 1, "prompt_tokens": 2},
            "choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": "hello"}}],
        },
        start_time=start,
        end_time=start + timedelta(seconds=1),
        user_id=None,
        print_verbose=lambda _: None,
    )

    (span,) = exporter.get_finished_spans()
    assert span.name == "litellm.completion"
    assert span.attributes["gen_ai.request.model"] == "gpt-4o"
    assert span.attributes["gen_ai.request.top_p"] == 0.5
    assert span.attributes["gen_ai.prompt.0.content"] == "hi"
    assert span.attributes["gen_ai.response.model"] == "gpt-4o-2024-08-06"
    assert span.attributes["gen_ai.usage.prompt_tokens"] == 2
    assert span.attributes["gen_ai.completion.0.content"] == "hello"
