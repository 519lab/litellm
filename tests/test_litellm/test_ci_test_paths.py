from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = REPO_ROOT / ".github" / "workflows"
UNIT_TESTS = REPO_ROOT / "tests" / "test_litellm"


def _job_test_paths() -> tuple[tuple[str, ...], ...]:
    workflows = tuple(yaml.safe_load(path.read_text()) or {} for path in sorted(WORKFLOWS.glob("*.yml")))
    jobs = tuple(job for workflow in workflows for job in (workflow.get("jobs") or {}).values())
    return tuple(
        tuple(str(job["with"]["test-path"]).split())
        for job in jobs
        if isinstance(job.get("with"), dict) and job["with"].get("test-path")
    )


def _is_under(path: str, root: str) -> bool:
    return path == root or path.startswith(root.rstrip("/") + "/")


def _job_collects(test_file: str, tokens: tuple[str, ...]) -> bool:
    ignored = tuple(token.removeprefix("--ignore=") for token in tokens if token.startswith("--ignore="))
    selected = tuple(token for token in tokens if not token.startswith("-"))
    if any(_is_under(test_file, root) for root in ignored):
        return False
    roots = tuple(_expand(token) for token in selected)
    return any(_is_under(test_file, root) for expansion in roots for root in expansion)


def _expand(token: str) -> tuple[str, ...]:
    if "*" not in token:
        return (token,)
    return tuple(str(path.relative_to(REPO_ROOT)) for path in REPO_ROOT.glob(token))


def test_every_unit_test_file_is_collected_by_a_ci_job():
    jobs = _job_test_paths()
    test_files = tuple(sorted(str(path.relative_to(REPO_ROOT)) for path in UNIT_TESTS.rglob("test_*.py")))

    uncollected = tuple(path for path in test_files if not any(_job_collects(path, tokens) for tokens in jobs))

    assert jobs, "no test-path inputs found in .github/workflows"
    assert uncollected == (), (
        "These test files are not in any CI job's test-path, so CI never runs them. "
        f"Add their directory to a job in .github/workflows/test-unit-*.yml: {uncollected}"
    )
