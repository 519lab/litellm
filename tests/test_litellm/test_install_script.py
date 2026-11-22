"""Tests for the fork installer ``scripts/install.sh`` and ``scripts/create_litellm_branch.sh``.

The installer installs 519lab/litellm releases, so these tests pin the parts that decide what gets installed:
which tag ``latest`` means, how the checkout reaches the requested ref (by fork URL, never by a possibly stale
remote name), the refusals that protect a live checkout, and the checksum gate on the uv download. Everything
runs offline against local bare repositories and ``file://`` downloads; the full sync is exercised by hand
because it builds the Rust extension and downloads the locked dependencies.
"""

import hashlib
import os
import platform
import shutil
import subprocess
import tarfile
from collections.abc import Mapping
from pathlib import Path

import pytest

_REPO_ROOT = Path(__file__).resolve().parents[2]
_INSTALL = _REPO_ROOT / "scripts" / "install.sh"
_INSTALL_CLI = _REPO_ROOT / "scripts" / "install-cli.sh"
_CREATE_BRANCH = _REPO_ROOT / "scripts" / "create_litellm_branch.sh"

pytestmark = pytest.mark.skipif(
    shutil.which("bash") is None or shutil.which("git") is None,
    reason="the installer is a bash script driving git",
)


def _isolated_env(home: Path, extra: Mapping[str, str] | None = None) -> dict[str, str]:
    base = {
        key: value
        for key, value in os.environ.items()
        if not key.startswith(("GIT_", "LITELLM_", "XDG_")) and key != "HOME"
    }
    return {
        **base,
        "HOME": str(home),
        "XDG_DATA_HOME": str(home / "data"),
        "GIT_CONFIG_GLOBAL": os.devnull,
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@example.com",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@example.com",
        **(extra or {}),
    }


def _git(env: Mapping[str, str], cwd: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=cwd, env=env, check=True, capture_output=True, text=True).stdout.strip()


def _commit(env: Mapping[str, str], repo: Path, name: str) -> str:
    (repo / f"{name}.txt").write_text(name)
    _git(env, repo, "add", ".")
    _git(env, repo, "commit", "-q", "-m", name)
    return _git(env, repo, "rev-parse", "HEAD")


def _publish(env: Mapping[str, str], work: Path, bare: Path) -> None:
    _git(env, work, "push", "-q", "--force", str(bare), "HEAD:refs/heads/main", "--tags")


def _source(env: Mapping[str, str], snippet: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", "-c", f'source "{_INSTALL}"; {snippet}'],
        env=env,
        capture_output=True,
        text=True,
    )


@pytest.fixture
def home(tmp_path: Path) -> Path:
    path = tmp_path / "home"
    path.mkdir()
    return path


@pytest.fixture
def fork(tmp_path: Path, home: Path) -> tuple[Path, Path, dict[str, str]]:
    env = _isolated_env(home)
    work = tmp_path / "work"
    work.mkdir()
    _git(env, work, "init", "-q", "-b", "main")
    bare = tmp_path / "fork.git"
    _git(env, tmp_path, "init", "-q", "--bare", str(bare))
    return work, bare, env


def test_latest_resolves_the_highest_stable_release_tag(fork: tuple[Path, Path, dict[str, str]]) -> None:
    work, bare, env = fork
    for tag in ("v1.94.0-fork.3", "v2.0.0", "v2.0.9", "v2.0.10", "v2.1.0-rc.1"):
        _commit(env, work, tag)
        _git(env, work, "tag", tag)
    _publish(env, work, bare)

    result = _source({**env, "LITELLM_FORK_URL": str(bare)}, "resolve_ref latest")

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "v2.0.10"


def test_latest_fails_when_the_fork_has_no_stable_release(fork: tuple[Path, Path, dict[str, str]]) -> None:
    work, bare, env = fork
    _commit(env, work, "one")
    _git(env, work, "tag", "v1.94.0-fork.3")
    _publish(env, work, bare)

    result = _source({**env, "LITELLM_FORK_URL": str(bare)}, "resolve_ref latest")

    assert result.returncode != 0
    assert "no vX.Y.Z release tag" in result.stderr


def test_explicit_ref_is_used_as_given(home: Path) -> None:
    result = _source(_isolated_env(home), "resolve_ref litellm_some_branch")

    assert result.stdout.strip() == "litellm_some_branch"


def test_paths_default_and_resolve_to_absolute(home: Path, tmp_path: Path) -> None:
    result = subprocess.run(
        ["bash", "-c", f'source "{_INSTALL}"; parse_args --dir rel/checkout; echo "$DIR|$VENV|$EXTRAS|$REF"'],
        cwd=tmp_path,
        env=_isolated_env(home),
        capture_output=True,
        text=True,
    )

    assert result.stdout.strip() == (
        f"{tmp_path}/rel/checkout|{tmp_path}/rel/checkout/.venv|proxy,proxy-runtime,extra_proxy,semantic-router|latest"
    )


@pytest.mark.parametrize(
    ("args", "message"),
    [(["--bogus"], "unknown argument: --bogus"), (["--ref"], "--ref needs a value"), (["--venv", ""], "--venv needs")],
)
def test_bad_arguments_fail_before_doing_anything(home: Path, args: list[str], message: str) -> None:
    result = subprocess.run(["bash", str(_INSTALL), *args], env=_isolated_env(home), capture_output=True, text=True)

    assert result.returncode != 0
    assert message in result.stderr
    assert not (home / "litellm").exists()


def test_dry_run_refuses_to_create_a_new_install(home: Path) -> None:
    result = subprocess.run(
        ["bash", str(_INSTALL), "--ref", "v2.0.0", "--dir", str(home / "missing"), "--dry-run"],
        env=_isolated_env(home),
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert "previews an upgrade of an existing install" in result.stderr
    assert not (home / "missing").exists()


def test_cli_installer_targets_the_cli_extra_and_its_own_venv(home: Path) -> None:
    result = subprocess.run(
        ["bash", str(_INSTALL_CLI), "--bogus"], env=_isolated_env(home), capture_output=True, text=True
    )

    assert "unknown argument: --bogus" in result.stderr
    wrapper = _INSTALL_CLI.read_text()
    assert "--extras cli" in wrapper
    assert "litellm-cli-venv" in wrapper


def test_fresh_install_clones_the_fork_at_the_tag(fork: tuple[Path, Path, dict[str, str]], home: Path) -> None:
    work, bare, env = fork
    tagged = _commit(env, work, "release")
    _git(env, work, "tag", "v2.0.0")
    _commit(env, work, "after")
    _publish(env, work, bare)
    checkout = home / "litellm"

    result = _source(
        {**env, "LITELLM_FORK_URL": str(bare)},
        f'DIR="{checkout}"; prepare_checkout v2.0.0',
    )

    assert result.returncode == 0, result.stderr
    assert _git(env, checkout, "rev-parse", "HEAD") == tagged


def test_upgrade_fetches_by_fork_url_even_when_a_remote_name_is_stale(
    fork: tuple[Path, Path, dict[str, str]], tmp_path: Path
) -> None:
    work, bare, env = fork
    _commit(env, work, "old")
    _git(env, work, "tag", "v2.0.0")
    _publish(env, work, bare)
    stale = tmp_path / "stale.git"
    _git(env, tmp_path, "clone", "-q", "--bare", str(bare), str(stale))
    checkout = tmp_path / "live"
    _git(env, tmp_path, "clone", "-q", "-b", "main", str(stale), str(checkout))
    release = _commit(env, work, "new")
    _git(env, work, "tag", "v2.0.1")
    _publish(env, work, bare)

    result = _source(
        {**env, "LITELLM_FORK_URL": str(bare)},
        f'DIR="{checkout}"; prepare_checkout v2.0.1 && move_checkout',
    )

    assert result.returncode == 0, result.stderr
    assert _git(env, checkout, "rev-parse", "HEAD") == release
    assert _git(env, checkout, "symbolic-ref", "--short", "HEAD") == "main"


def test_upgrade_refuses_a_checkout_with_uncommitted_changes(
    fork: tuple[Path, Path, dict[str, str]], tmp_path: Path
) -> None:
    work, bare, env = fork
    first = _commit(env, work, "old")
    _commit(env, work, "new")
    _git(env, work, "tag", "v2.0.1")
    _publish(env, work, bare)
    checkout = tmp_path / "live"
    _git(env, tmp_path, "clone", "-q", "-b", "main", str(bare), str(checkout))
    _git(env, checkout, "reset", "-q", "--hard", first)
    (checkout / "old.txt").write_text("edited on the server")

    result = _source({**env, "LITELLM_FORK_URL": str(bare)}, f'DIR="{checkout}"; prepare_checkout v2.0.1')

    assert result.returncode != 0
    assert "uncommitted changes" in result.stderr
    assert _git(env, checkout, "rev-parse", "HEAD") == first


def test_upgrade_refuses_a_branch_that_diverged_from_the_release(
    fork: tuple[Path, Path, dict[str, str]], tmp_path: Path
) -> None:
    work, bare, env = fork
    _commit(env, work, "base")
    _publish(env, work, bare)
    checkout = tmp_path / "live"
    _git(env, tmp_path, "clone", "-q", "-b", "main", str(bare), str(checkout))
    local = _commit(env, checkout, "local-only")
    _commit(env, work, "release")
    _git(env, work, "tag", "v2.0.1")
    _publish(env, work, bare)

    result = _source({**env, "LITELLM_FORK_URL": str(bare)}, f'DIR="{checkout}"; prepare_checkout v2.0.1')

    assert result.returncode != 0
    assert "has commits that v2.0.1 does not" in result.stderr
    assert _git(env, checkout, "rev-parse", "HEAD") == local


def _uv_platform() -> str:
    machine = platform.machine()
    arch = "aarch64" if machine in ("aarch64", "arm64") else machine
    return f"{arch}-apple-darwin" if platform.system() == "Darwin" else f"{arch}-unknown-linux-gnu"


def _fake_uv_release(root: Path, *, corrupt: bool) -> Path:
    base = root / "releases"
    release = base / "0.11.7"
    release.mkdir(parents=True)
    staging = root / "staging" / f"uv-{_uv_platform()}"
    staging.mkdir(parents=True)
    for tool in ("uv", "uvx"):
        (staging / tool).write_text("#!/bin/sh\necho 'uv 0.11.7'\n")
        (staging / tool).chmod(0o755)
    asset = release / f"uv-{_uv_platform()}.tar.gz"
    with tarfile.open(asset, "w:gz") as archive:
        archive.add(staging, arcname=staging.name)
    digest = "0" * 64 if corrupt else hashlib.sha256(asset.read_bytes()).hexdigest()
    (release / f"{asset.name}.sha256").write_text(f"{digest}  {asset.name}\n")
    return base


@pytest.mark.parametrize("corrupt", [False, True])
def test_uv_is_installed_only_when_its_checksum_matches(home: Path, tmp_path: Path, corrupt: bool) -> None:
    base = _fake_uv_release(tmp_path, corrupt=corrupt)
    env = _isolated_env(home, {"LITELLM_UV_DOWNLOAD_BASE": f"file://{base}", "PATH": "/usr/bin:/bin"})

    result = _source(env, 'ensure_uv && echo "$UV"')

    installed = home / "data" / "litellm-install" / "uv-0.11.7" / "uv"
    if corrupt:
        assert result.returncode != 0
        assert "failed its SHA-256 check" in result.stderr
        assert not installed.parent.exists()
    else:
        assert result.returncode == 0, result.stderr
        assert result.stdout.strip().splitlines()[-1] == str(installed)
        assert installed.is_file()


@pytest.mark.parametrize(
    ("source", "new_name", "expected"),
    [
        ("Feature/Foo.Bar", None, "litellm_foo_bar"),
        ("work", "My Fix/Thing", "litellm_my_fix_thing"),
        ("work", "litellm_Already-Named", "litellm_already-named"),
    ],
)
def test_create_branch_names_match_the_pre_push_rule(
    fork: tuple[Path, Path, dict[str, str]], source: str, new_name: str | None, expected: str
) -> None:
    work, _, env = fork
    _commit(env, work, "base")
    _git(env, work, "branch", source)

    result = subprocess.run(
        ["bash", str(_CREATE_BRANCH), source, *([new_name] if new_name else [])],
        cwd=work,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert _git(env, work, "branch", "--show-current") == expected
