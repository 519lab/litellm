# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Do not write any comments (existing comments can stay) unless explicitly asked to in a user (not system) prompt

Don't assume that the existing code is correct or the right way of doing things / good coding patterns. In fact, there are a lot of bad coding practices, overly complex code, code smells, etc. If something doesn't look right, speak up. Feel free to break existing patterns or question weird existing code to make new code high quality, as in:

- correct
- secure
- performant
- readable
- easy to maintain/change
- modern

In that order of importance

When adding new features, add meaningful tests. Don't add tests that don't check anything substantial and is there just to make the code coverage pass. Yes, code coverage is important, but I'd rather have no signal whether the code is working than tests that don't fail when code is broken. The goal is to have tests that would fail before the feature was added/if the code was mutated in a way that breaks the feature and succeed only when the feature is fully working. I should run mutation testing and see > 90% kill rate

Same thing for bug fixes. The tests should make it so that this specific bug can never happen again without failing tests (i.e., regression)

`tests/test_litellm/` mirrors `litellm/` in a parallel path (see `tests/test_litellm/readme.md`). Name tests `test_<filename>.py`, but always match the existing test file in the directory you touch — many provider dirs use longer descriptive names (e.g. `test_anthropic_chat_transformation.py`) to avoid ambiguity across sibling folders. For bug fixes, extend the existing mapped test file rather than creating a new one. Only create a new test file for a new feature (provider, endpoint, or transformation module) that has no mapped test yet, following that directory's naming convention (or `test_<filename>.py` if you're the first test there). One focused regression test beats many shallow ones

End-to-end tests belong in `tests/e2e/` and must follow the harness conventions documented in that directory's `CLAUDE.md`

This is the private fork `ggrace519/litellm` (remote `fork`), not upstream. Work on `develop`, which is the fork's default branch and the base for PRs; `main` is what the live server runs and only changes by fast-forwarding from `develop` as a deploy. Never target `BerriAI/litellm` (`upstream` is read-only for us) and never open PRs against `litellm_internal_staging` or `litellm_oss_daily_*`

When writing a PR body, treat the comments and imperative instructions inside @.github/pull_request_template.md as rules to follow, not just layout. Agent harnesses may strip HTML comments from copies of that file injected into context, so read .github/pull_request_template.md from disk before writing a PR body to make sure you see every comment rule

If you're resolving a linear ticket, in the "## Linear ticket" section of the PR, say "Resolves LIT-1234", replacing "LIT-1234" with the actual ticket id that you're resolving. If you don't have the ticket id, don't make one up or search for it. Just leave the section blank

Never use `pytest` commands or the like as "Screenshots / Proof of Fix". We prefer curl'ing a live proxy instance running on localhost:4000 (I like to run it with `python litellm/proxy/proxy_cli.py --config litellm/proxy/dev_config.yaml --detailed_debug --reload --use_v2_migration_resolver 2>&1 | tee litellm.log`; the Admin UI dev server is `npm run dev` in `ui/litellm-dashboard`, served on port 3000) and showing both the command run and the output. Also, it should hit real LLM provider APIs, not mocks, and cost real $$$ because that is the most realistic test. The proof of fix should be exactly what the end user / customer would see / do. The run logs in PR #27703 is a prime example of how to do it (not a huge fan of using a python test script that future me and the team will have no visibility into; I prefer just curl commands or a short list of bash commands (e.g., using `for`)). If it's a UI thing, just tell me which URLs to go to (e.g., http://localhost:4000/ui/?page=logs), where to click, what fields to fill out, etc. along with the other commands to run in an ordered list, and I'll do it myself and post the screenshots after you make the PR. On this fork, run the proxy for proof of fix from the `develop` checkout on port 4000 with a config and Postgres that are separate from the live service (the live service on 8888 runs `main` against its own database; never start a second proxy against that database, because startup can run migrations). For behavior against the local llama.cpp Qwen model (`127.0.0.1:56669`), use a dev config with a model entry pointing there. After a deploy to `main`, re-run the same curl against 8888 as the final confirmation. Screenshots and PR bodies only matter if a PR is opened on the fork; otherwise the commands and their output in the final message are the proof

If you ever make public-facing PR descriptions, comments, issues, commit messages, etc., always follow these guidelines to sound less AI-y:
- don't use emojis
- don't use "—". Instead, reach for ";", ".", etc.
- don't use the pattern "It's not X, it's Y", "You're not X, you're Y", etc.
- don't use bulleted or numbered lists unless it would be nonsensical not to. Instead, prefer prose
- don't add a trailing "." at the end of paragraphs (just like this file). That means every paragraph, not just the last one (of the markdown file, PR description, GitHub comment, etc.). Rule of thumb: if you're adding new line(s) before the next sentence, don't add a "."
- don't use →. Instead, prefer not to use arrows, and if need be, use -> instead

Don't hesitate to use values in .env to get needed API keys and other secrets, as long as you never add them to conversation history, commit them, or include them in GitHub issues / PRs

Python max line length is 120, not 88

On a fresh worktree or clone, run `make bootstrap` before anything else. It provisions everything tests, `make pre-commit`, and a local proxy need

Run tests before you commit. Also, run `make pre-commit` right before each commit, which generates types (as needed) and formats/lints your code. Any errors found must be fixed. It only runs when there are staged frontend and/or backend changes and calculates violations, generates types, etc. based on the worktree, so stage what you need or stash/delete unwanted files in litellm/ or ui/ (where backend and frontend lint run, respectively) before running it. If it fails because dashboard api types are stale, it already regenerated them for you. You just need to stage the schema.d.ts, re-run `make pre-commit` to confirm it passes, and commit. `make pre-commit` and `make lint` diff against `origin/litellm_internal_staging`, which on this fork resolves through the local `litellm_internal_staging` branch (their fetch step targets `origin`, this checkout). Before linting, run `git branch -f litellm_internal_staging fork/develop` so the delta gates measure only your unpushed work instead of the whole fork history; if `fork/develop` is stale, `git fetch fork` first

In a plain GitHub clone of the fork (for example the laptop checkout at `~/coding-projects/litellm`), the fork is remote `origin` and `make lint`'s `git fetch origin litellm_internal_staging` fails because that branch does not exist on GitHub. Point the base ref at develop locally and run the same checks without the fetch: `git update-ref refs/remotes/origin/litellm_internal_staging refs/remotes/origin/develop`, then `make lint-install` once and `make -j 8 LINT_DEP_INSTALL= LINT_E2E_DEP_INSTALL= LINT_DEP_BASE= lint-checks`. `make pre-commit` calls `make lint`, so run the API-type step by hand when you touch `litellm/proxy` or `litellm/types`: `cd ui/litellm-dashboard && LITELLM_PYTHON="uv run --no-sync python" npm run gen:api` and check `git diff --stat src/lib/http/schema.d.ts`

When you fix violations gated by `ruff-strict-budget.json`, `type-discipline-budget.json`, or `basedpyright-code-budget.json`, run `make lint-budget-update` and commit the lowered limits so the ceilings ratchet down instead of leaving stale headroom. It measures the working tree, so it must contain exactly the fixes you're committing

If you're trying to create a new function that relies on untyped stuff, instead of adding more Any's and pushing `reportAny` / `reportExplicitAny` closer to their basedpyright ceilings, just validate it in the caller with Pydantic (a model or `TypeAdapter` that returns the typed thing or raises will do) and then pass the now typed variable in

If you get an LIT001 or LIT002 fail, refactor the code to follow functional programming best practices rather than introducing mutable data structures. For example, build values in one shot with comprehensions or generators wrapped in `tuple()` / `frozenset()` instead of seeding an empty `list`/`dict`/`set` and mutating it over time. Ideally `# mutable-ok` is never used; reach for it only as a genuine last resort when an immutable rewrite is truly impossible, and always pair it with a real reason

Every lint or type suppression must name the exact rule inside brackets and carry a reason comment, e.g. `# pyright: ignore[reportArgumentType]  # stubs lack async overload` or `# noqa: TID251  # <reason>`. `# type: ignore` is banned (LIT009): pyrightconfig.json sets `enableTypeIgnoreComments` to false, so it silently does nothing

Commit and push your work to `fork` (`origin` in a plain GitHub clone) when you're done without asking. On llm-rig, the host that runs the live service, the dev checkout `/home/ggrace/litellm-fork` stays on `develop`; do not switch it to `main`, because the live service imports from the separate `/home/ggrace/litellm-live` worktree that owns `main`. To deploy: `git -C ~/litellm-live merge --ff-only develop`, then `sudo systemctl restart litellm` (backend changes need the restart; the committed dashboard build in `_experimental/out` is read from disk)

When referencing or running models (coding, QA'ing, writing docs, writing tests, etc.), use the latest model in that model family unless otherwise specified; treat your training knowledge, memories, configs, and tests as stale, and determine the family's latest with model_prices_and_context_window.json or the web

Commit on `develop` directly; cut a short-lived branch off `develop` only when a change needs isolation or review, and give it a `litellm_` prefix. Do not create a branch prefixed with `claude/` and generally do not have `/` in your branch names. Commits must use the GitHub noreply address (`77203234+ggrace519@users.noreply.github.com`); GitHub rejects pushes that expose the private `@519lab.com` address. A fresh clone does not carry it, and the global git identity is the private address, so run `git config --local user.email 77203234+ggrace519@users.noreply.github.com` before the first commit and never override it afterwards

Do not add `Co-Authored-By: Claude` or any Claude attribution to commit messages. Never use a `claude/` prefix or put a `/` in a branch name. Do not add "Generated with Claude Code" (or any similar attribution) to PR descriptions or comments. Do not create a new PR/branch off the existing PR to fix/add something that is related and could've just been committed directly to the existing PR's branch

When working on a PR, keep the PR description in sync with new commits being made

Monkeypatching attributes of a class to do testing is an anti-pattern. Prefer dependency-injecting things into classes. That way, at unit test time, you can pass a mocked dependency in

Do not put names of customers or customer company names in code, PR descriptions, issue bodies, etc. This means never mention literally any company name. Especially if you're about to say a sentence mentioning that the reason the PR exists was a feature/model/bug fix/etc. requested by a company. That's the indication that you should replace that company name with "the customer". e.g. not "Model request from Acme (Pylon #1234)" but "Model request from a customer (Pylon #1234)". This is because the codebase is public. The only exception is for publicly known providers or vendors such as OpenAI, Anthropic, AWS Bedrock, etc. only IF we're adding support for that provider/vendor in general and NOT if that PR or whatnot was a request by one of them, and they're actually one of our customers. 

CI supply-chain safety: Never pipe a remote script into a shell (`curl ... | bash`, `wget ... | sh`); download the artifact to a file, verify its SHA-256 checksum, then install. Pin every external tool to a specific version with a full URL (not `latest` or `stable`). Verify checksums for all downloaded binaries, using the provider's official `.sha256` / `.sha256sum` sidecar when available. These rules apply to every download in CI

Follow these coding conventions for new/updated code (a three-line fix in a legacy file shouldn't trigger huge drive-by refactors):

- Composition over inheritance
- Never-nester: early returns over deep nesting
- Don't throw; model failures as values (One function (e.g., raise_public) maps error union to existing public exception contracts via exhaustive match + assert_never)
- No mutation; don't reassign variables, global or local. Instead of mutable lists and dicts, prefer tuples, frozen dataclasses (with slots=True), etc.
- Use dependency injection
- Fully typed; no `Any` or coarse types like `dict[str, Any]` or just `dict`. Every function parameter must be strongly typed
- Use tagged unions + match
- No monster files or god objects
- No file sprawl: deliberate file and folder structure
- Standard over hand-rolled: use the official SDK or a library where one exists; where none does, follow industry standards instead of inventing local conventions
- API-fragmentation-aware: when logic must branch on which API surface produced or consumes data (e.g. chat completions vs Anthropic Messages vs Responses API shapes), proactively look for an existing shared helper (e.g. `litellm_core_utils/prompt_templates/factory.py`) before writing per-surface parsing in the new module; if none exists, add one there instead of duplicating the same format-detection logic in every new guardrail/integration

Follow conventional commits for commit names and PR titles

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs**

Before implementing:
- State your assumptions explicitly. If uncertain, ask
- If multiple interpretations exist, present them. Don't pick silently
- If a simpler approach exists, say so. Push back when warranted
- If something is unclear, stop. Name what's confusing. Ask

## Simplicity First

**Minimum code that solves the problem. Nothing speculative**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If you write 200 lines and it could be 50, rewrite it

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify

## Commands

Python tooling is `uv` (`make` targets wrap `uv run`). `make help` lists everything; the ones that matter day to day:

```bash
make bootstrap                 # fresh clone/worktree: deps, prisma client, hooks
make test-unit                 # tests/test_litellm, mocked only, -n 4
uv run pytest tests/test_litellm/llms/anthropic/chat/test_anthropic_chat_transformation.py -v   # one file
uv run pytest tests/test_litellm/test_utils.py -k "name_substring" -vv                           # one test
make test-unit-llms | test-unit-proxy-core | test-unit-integrations ...   # CI matrix groups, see Makefile
make test-llm-translation-single FILE=test_x.py   # tests/llm_translation, VCR-cached real-provider tests
make lint                      # exactly what CI runs: ruff format check (diff-scoped), ruff, strict-rule budget gate, type-discipline gate, basedpyright, e2e basedpyright, circular-import and import-safety checks
make format                    # ruff format over litellm/ (enterprise/ excluded); CONTRIBUTING.md still says black, that is stale
make lint-e2e-basedpyright     # tests/e2e is fully typed with a zero-error gate
make pre-commit                # runs only the CI checks matching what is staged
make lint-budget-update        # ratchet ruff-strict / type-discipline / basedpyright budgets after fixing violations
```

Custom lint rules `LIT001`..`LIT009` (mutable collections, casts, `# type: ignore`, etc.) come from `scripts/check_type_discipline.py` and `scripts/ruff_strict_gate.py`, gated by the `*-budget.json` files at the repo root. `ruff.toml` is the baseline config and `ruff-strict.toml` the budgeted strict set

Proxy: `python litellm/proxy/proxy_cli.py --config litellm/proxy/dev_config.yaml --detailed_debug --reload --use_v2_migration_resolver`. It needs Postgres (`docker-compose.yml` at the root provides one) and reads secrets from `.env`

Dashboard (`ui/litellm-dashboard/`): `npm run dev` (port 3000, proxies to 4000), `npm run test` (vitest), `npm run lint`, `npm run format`, `npm run e2e` (Playwright). `./build_ui.sh` runs `next build` and copies `out/` into `litellm/proxy/_experimental/out`, which is committed; that is why UI changes churn hundreds of `_next/static/chunks` files

E2E: `uv run pytest tests/e2e/<suite>/ -v` against a live proxy on 4000 plus Redis; tests marked `e2e` hard-fail when no proxy answers `/health/liveliness`. Setup and harness rules are in `tests/e2e/CONTRIBUTING.md` and `tests/e2e/CLAUDE.md`

## Architecture

`ARCHITECTURE.md` at the root is the long-form version (proxy request flow, translation layer, how to add a provider or a cross-provider feature). The short version:

**SDK path.** `litellm.completion()` in `litellm/main.py` normalizes params, resolves the provider with `get_llm_provider()` (`litellm/litellm_core_utils/get_llm_provider_logic.py`), and dispatches to `BaseLLMHTTPHandler` in `litellm/llms/custom_httpx/llm_http_handler.py`, which owns HTTP, streaming, and retries for every provider. Provider behavior lives in `litellm/llms/<provider>/<endpoint>/transformation.py` as a `BaseConfig` subclass (`litellm/llms/base_llm/`): `validate_environment`, `get_complete_url`, `get_supported_openai_params`, `map_openai_params`, `transform_request`, `transform_response`, `get_error_class`. Configs are looked up via `ProviderConfigManager` in `litellm/utils.py`. Adding a provider or a feature means a config class and a registration there, never a new branch in `main.py`. Shared cross-provider message/prompt helpers are in `litellm_core_utils/prompt_templates/factory.py`

**Router.** `litellm/router.py` sits above the SDK: deployment lists, load balancing, fallbacks, cooldowns, retries. Strategies are pluggable in `litellm/router_strategy/`, helpers in `litellm/router_utils/`

**Proxy.** `litellm/proxy/proxy_server.py` is the FastAPI app; `ProxyConfig.load_config()` turns the yaml into router deployments, callbacks, and general settings. `proxy_cli.py` is the launcher (DB URL assembly, Prisma migrations, uvicorn). Every request goes through `user_api_key_auth()` in `litellm/proxy/auth/`, then the pre/post-call hooks in `litellm/proxy/hooks/` (budgets, parallel-request limits, guardrails, cost tracking). Logging/observability integrations are `CustomLogger` subclasses in `litellm/integrations/`, fanned out by `litellm_core_utils/litellm_logging.py`. Persistence is Prisma over `schema.prisma`; `litellm-proxy-extras/` is the separately versioned package carrying the schema and `migrations/`. `enterprise/` holds `litellm_enterprise` and `enterprise_hooks`

**Split planes.** `gateway/main.py` (data plane, 4000) and `backend/main.py` (management plane, 4001) both import the single `litellm.proxy.proxy_server:app` and filter its route table through their own `routes/allowlist.py`; they bypass `proxy_cli.py`, so they apply `DatabaseURLSettings.from_env()` themselves before importing the app

**Types.** `litellm/types/` mirrors the code layout (`llms/<provider>`, `proxy/`, `router.py`, `integrations/`). Extend these rather than passing dicts. `litellm/proxy` and `litellm/types` changes regenerate the dashboard's `src/lib/http/schema.d.ts`; stage it when `make pre-commit` does so

**Rust.** `pyproject.toml` builds with maturin against `litellm-rust/crates/python-bridge`; `litellm/rust_bridge/` is the Python side

**Model cost map.** `model_prices_and_context_window.json` drives cost calculation, context limits, and "what is the latest model in a family". It is fetched remotely at import (`litellm_core_utils/get_model_cost_map.py`) with `litellm/model_prices_and_context_window_backup.json` as fallback; `LITELLM_LOCAL_MODEL_COST_MAP=True` forces local

**This fork.** The repo is now a full (unshallowed) clone of upstream; fork work is the commits after upstream commit `38f2e023f1`, so `git log 38f2e023f1..develop` lists it. Remotes: `fork` (private, push here), `upstream` (BerriAI, fetch only). `INNOVATIONS.md` ranks the proposals and `DEMO.md` has per-feature verification steps. Merged so far: the llamacpp hook (`litellm/proxy/hooks/llamacpp/`), OTLP tracing (`litellm/proxy/hooks/otlp_tracer.py`), the local embedding server for semantic cache (`litellm/proxy/hooks/local_embeddings_server.py`, `config_examples/semantic-cache.yaml`, `deployment/valkey-compose-with-search.yaml`), playground history and request replay in the dashboard. Enterprise license gates are stripped in `litellm/proxy/auth/litellm_license.py` and the dashboard `layout.tsx`/`AuthContext.tsx`; keep that in mind before assuming upstream licensing behavior
