"""Regression test: ``make lint``'s base ref must be the fork's ``develop``.

The lint targets used to fetch and diff against ``origin/litellm_internal_staging``, a branch that only exists
upstream, so ``make lint`` and ``make pre-commit`` failed at the fetch in every plain clone of the fork. This
dry-runs the real Makefile targets and checks every step that depends on the base.
"""

import shutil
import subprocess
from pathlib import Path

import pytest

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BASE_TARGETS = (
    "lint-fetch-base",
    "lint-format-check-changed",
    "lint-gate",
    "lint-type-discipline",
    "lint-basedpyright",
)

pytestmark = pytest.mark.skipif(shutil.which("make") is None, reason="needs make")


def _dry_run(*overrides: str) -> str:
    return subprocess.run(
        ["make", "-n", "LINT_DEP_INSTALL=", "LINT_DEP_BASE=", *overrides, *_BASE_TARGETS],
        cwd=_REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout


@pytest.mark.parametrize(("overrides", "remote"), [((), "origin"), (("LINT_BASE_REMOTE=fork",), "fork")])
def test_every_lint_step_uses_the_forks_develop_as_base(overrides: tuple[str, ...], remote: str) -> None:
    commands = _dry_run(*overrides)

    assert f"git fetch {remote} develop" in commands
    assert commands.count(f"--base {remote}/develop") == 3
    assert f"git diff --name-only {remote}/develop...HEAD" in commands
    assert "litellm_internal_staging" not in commands
