"""Resolve which reasoning_effort values a deployment, and by intersection a model group, accepts.

An entry that states its levels outright in reasoning_effort_levels is read first and wins
whole, for a model whose set the per-level flags cannot express: Kimi K3 takes low, high and max,
and no flag can drop medium because medium has none. Every other entry answers through the
supports_*_reasoning_effort flags below, whose polarity mirrors how a request path reads that same
flag. medium and high are unconditional for a reasoning model. minimal and low are opt-out:
openai/chat/gpt_5_transformation.py refuses them only when the map says false. xhigh and max are
opt-in. none is opt-out everywhere except the azure gpt-5 family, whose config raises
UnsupportedParamsError without an explicit true.

A deployment the map describes with no effort flags at all resolves to None rather than to the
opt-out defaults.
"""

from collections.abc import Mapping, Sequence
from types import MappingProxyType
from typing import Final, get_args

import litellm
from litellm.types.llms.openai import REASONING_EFFORT

REASONING_EFFORT_ADVERTISEMENT_ORDER: Final = get_args(REASONING_EFFORT)
_EMPTY_ENTRY: Final[Mapping[str, object]] = MappingProxyType({})

_EFFORT_FLAGS: Final = (
    ("none", "supports_none_reasoning_effort"),
    ("minimal", "supports_minimal_reasoning_effort"),
    ("low", "supports_low_reasoning_effort"),
    ("xhigh", "supports_xhigh_reasoning_effort"),
    ("max", "supports_max_reasoning_effort"),
)
_DECLARED_EFFORTS_KEY: Final = "reasoning_effort_levels"
_OPT_OUT_EFFORTS: Final = ("minimal", "low")
_OPT_IN_EFFORTS: Final = ("xhigh", "max")
_UNCONDITIONAL_EFFORTS: Final = frozenset(("medium", "high"))


def _bare_model_entry(model_info: Mapping[str, object]) -> Mapping[str, object]:
    """The unprefixed twin of a provider-prefixed map entry; flags often live there."""
    key: Final = model_info.get("key")
    provider: Final = model_info.get("litellm_provider")
    if not isinstance(key, str) or not isinstance(provider, str) or not key.startswith(f"{provider}/"):
        return _EMPTY_ENTRY
    entry: Final[Mapping[str, object] | None] = litellm.model_cost.get(key.removeprefix(f"{provider}/"))
    return entry if entry is not None else _EMPTY_ENTRY


def _declared_effort_flags(model_info: Mapping[str, object]) -> Mapping[str, object]:
    bare: Final = _bare_model_entry(model_info)
    return MappingProxyType(
        {
            effort: model_info.get(flag) if model_info.get(flag) is not None else bare.get(flag)
            for effort, flag in _EFFORT_FLAGS
        }
    )


def declared_reasoning_efforts(model_info: Mapping[str, object]) -> tuple[str, ...] | None:
    """The entry's own declared level set, or None if it doesn't declare one."""
    own: Final = model_info.get(_DECLARED_EFFORTS_KEY)
    raw: Final = own if own is not None else _bare_model_entry(model_info).get(_DECLARED_EFFORTS_KEY)
    if not isinstance(raw, Sequence) or isinstance(raw, (str, bytes)):
        return None
    declared: Final = frozenset(effort for effort in raw if isinstance(effort, str))
    return tuple(effort for effort in REASONING_EFFORT_ADVERTISEMENT_ORDER if effort in declared)


def _supports_none_reasoning_effort(model_info: Mapping[str, object], flag: object) -> bool:
    """Opt-in only for azure gpt-5 family; opt-out default everywhere else."""
    if model_info.get("litellm_provider") != "azure":
        return flag is not False

    from litellm.llms.azure.chat.gpt_5_transformation import AzureOpenAIGPT5Config

    key: Final = model_info.get("key")
    if not isinstance(key, str) or not AzureOpenAIGPT5Config.is_model_gpt_5_model(key):
        return flag is not False
    return flag is True


def deployment_is_catalog_mapped(
    resolved_model_info: Mapping[str, object] | None,
    operator_model_info: Mapping[str, object],
) -> bool:
    """Whether the model map described this deployment."""
    if resolved_model_info is None or resolved_model_info.get("mode") is None:
        return False
    return operator_model_info.get("mode") is None


def resolve_supported_reasoning_efforts(
    model_info: Mapping[str, object],
    *,
    deployment_is_mapped: bool,
) -> tuple[str, ...] | None:
    """None = nothing is known; () = known model that accepts no effort level."""
    supports_reasoning: Final = model_info.get("supports_reasoning")
    if supports_reasoning is not True:
        return () if supports_reasoning is False or deployment_is_mapped else None

    declared: Final = declared_reasoning_efforts(model_info)
    if declared is not None:
        return declared

    flags: Final = _declared_effort_flags(model_info)
    if all(value is None for value in flags.values()):
        return None

    opt_out: Final = frozenset(effort for effort in _OPT_OUT_EFFORTS if flags[effort] is not False)
    opt_in: Final = frozenset(effort for effort in _OPT_IN_EFFORTS if flags[effort] is True)
    none_level: Final = (
        frozenset(("none",)) if _supports_none_reasoning_effort(model_info, flags["none"]) else frozenset()
    )
    allowed: Final = opt_out | _UNCONDITIONAL_EFFORTS | opt_in | none_level
    return tuple(effort for effort in REASONING_EFFORT_ADVERTISEMENT_ORDER if effort in allowed)


def intersect_supported_reasoning_efforts(
    current: Sequence[str] | None,
    resolved: Sequence[str] | None,
) -> tuple[str, ...] | None:
    """Deployments without metadata (None) never narrow the group."""
    if resolved is None:
        return tuple(current) if current is not None else None
    if current is None:
        return tuple(resolved)
    keep: Final = frozenset(current) & frozenset(resolved)
    return tuple(effort for effort in REASONING_EFFORT_ADVERTISEMENT_ORDER if effort in keep)
