# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

REPO_ROOT = Path(__file__).resolve().parents[4]
MODULE_PATH = REPO_ROOT / "dev" / "skill-evals" / "eval.py"


@pytest.fixture(scope="module")
def skill_eval_module():
    spec = importlib.util.spec_from_file_location("skill_eval", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize(
    ("configured", "expected"),
    [
        pytest.param(None, "claude", id="default"),
        pytest.param("Claude", "claude", id="case-insensitive"),
        pytest.param("codex", "codex", id="codex"),
        pytest.param("OpenCode", "opencode", id="opencode"),
    ],
)
def test_get_runtime(monkeypatch, skill_eval_module, configured, expected):
    if configured is None:
        monkeypatch.delenv("AGENT_RUNTIME", raising=False)
    else:
        monkeypatch.setenv("AGENT_RUNTIME", configured)

    assert skill_eval_module.get_runtime() == expected


def test_get_runtime_rejects_unknown_runtime(monkeypatch, skill_eval_module):
    monkeypatch.setenv("AGENT_RUNTIME", "unknown")

    with pytest.raises(ValueError, match="claude, codex, opencode"):
        skill_eval_module.get_runtime()


def test_build_codex_provider(skill_eval_module, tmp_path):
    working_dir = tmp_path / "worktree"

    provider = skill_eval_module.build_codex_provider(
        "working", working_dir, "gpt-test", detect_skill_usage=True
    )

    assert provider == {
        "id": "openai:codex-sdk",
        "label": "working",
        "config": {
            "approval_policy": "never",
            "cli_config": {
                "history": {"persistence": "none"},
                "project_doc_max_bytes": skill_eval_module.CODEX_PROJECT_DOC_MAX_BYTES,
            },
            "enable_streaming": True,
            "model": "gpt-test",
            "network_access_enabled": False,
            "output_schema": skill_eval_module.OUTPUT_FORMAT["schema"],
            "sandbox_mode": "read-only",
            "web_search_mode": "disabled",
            "working_dir": str(working_dir),
        },
        "transform": "JSON.parse(output)",
    }


def test_output_schema_requires_every_property(skill_eval_module):
    schema = skill_eval_module.OUTPUT_FORMAT["schema"]

    assert set(schema["required"]) == set(schema["properties"])


def test_build_codex_provider_uses_runtime_default_model(skill_eval_module, tmp_path):
    provider = skill_eval_module.build_codex_provider("main", tmp_path / "worktree", None)

    assert "model" not in provider["config"]
    assert "enable_streaming" not in provider["config"]


def test_build_opencode_provider(skill_eval_module, tmp_path):
    working_dir = tmp_path / "worktree"

    provider = skill_eval_module.build_opencode_provider(
        "working", working_dir, "openai/gpt-test", detect_skill_usage=True
    )

    assert provider == {
        "id": "opencode:sdk",
        "label": "working",
        "config": {
            "apiKeyRequired": False,
            "custom_agent": {
                "description": "Read-only Airflow skill-eval agent",
                "mode": "primary",
                "prompt": skill_eval_module.OPENCODE_OUTPUT_INSTRUCTION,
            },
            "format": skill_eval_module.OUTPUT_FORMAT,
            "model": "gpt-test",
            "permission": {
                "*": "deny",
                "glob": "allow",
                "grep": "allow",
                "list": "allow",
                "read": "allow",
                "skill": "allow",
            },
            "provider_id": "openai",
            "tools": {
                "bash": False,
                "edit": False,
                "glob": True,
                "grep": True,
                "list": True,
                "lsp": False,
                "patch": False,
                "question": False,
                "read": True,
                "skill": True,
                "todowrite": False,
                "todoread": False,
                "webfetch": False,
                "write": False,
            },
            "working_dir": str(working_dir),
        },
        "transform": "JSON.parse(output)",
    }


def test_build_opencode_provider_disables_skill_tool_by_default(skill_eval_module, tmp_path):
    provider = skill_eval_module.build_opencode_provider(
        "main", tmp_path / "worktree", "openrouter/anthropic/claude-sonnet-4.6"
    )

    assert provider["config"]["provider_id"] == "openrouter"
    assert provider["config"]["model"] == "anthropic/claude-sonnet-4.6"
    assert provider["config"]["tools"]["skill"] is False
    assert provider["config"]["permission"]["skill"] == "deny"


@pytest.mark.parametrize(
    "model",
    [None, "gpt-test", "/gpt-test", "openai/"],
)
def test_validate_model_rejects_invalid_opencode_model(skill_eval_module, model):
    with pytest.raises(ValueError, match="provider/model-id"):
        skill_eval_module.validate_model("opencode", model)


def test_validate_model_accepts_provider_and_nested_model_id(skill_eval_module):
    assert (
        skill_eval_module.validate_model("opencode", "openrouter/anthropic/claude-sonnet-4.6")
        == "openrouter/anthropic/claude-sonnet-4.6"
    )


def test_validate_model_leaves_other_runtimes_unchanged(skill_eval_module):
    assert skill_eval_module.validate_model("codex", None) is None


def test_build_prompt_repeats_output_contract_for_opencode(skill_eval_module):
    assert skill_eval_module.build_prompt("opencode") == (
        "{{request}}\n\n" + skill_eval_module.OPENCODE_OUTPUT_INSTRUCTION
    )
    assert skill_eval_module.build_prompt("claude") == "{{request}}"


def test_count_provider_errors_includes_transform_errors(skill_eval_module, tmp_path):
    results_file = tmp_path / "results.json"
    results_file.write_text(
        json.dumps(
            {
                "results": {
                    "results": [
                        {"response": {"error": "provider failed"}},
                        {"error": "transform failed", "failureReason": 2},
                        {"error": "assertion failed", "failureReason": 1},
                        {"success": True},
                    ]
                }
            }
        )
    )

    assert skill_eval_module.count_provider_errors(results_file) == 2


@pytest.fixture
def promptfoo_layout(monkeypatch, skill_eval_module, tmp_path):
    """Build a prek-style node env and return an SDK installer for either location.

    ``install_root`` mirrors a package listed in the hook's
    additional_dependencies; ``bundled`` mirrors promptfoo's own optional
    dependency, nested inside its package.
    """
    install_root = tmp_path / "node_modules"
    promptfoo = install_root / "promptfoo"
    bundled = promptfoo / "node_modules"
    promptfoo.mkdir(parents=True)
    (promptfoo / "package.json").write_text("{}")
    promptfoo_bin = promptfoo / "promptfoo"
    promptfoo_bin.touch()
    monkeypatch.setattr(skill_eval_module.shutil, "which", lambda _: str(promptfoo_bin))
    monkeypatch.setattr(
        skill_eval_module,
        "run",
        lambda *args, **kwargs: SimpleNamespace(stdout=f"{skill_eval_module.PROMPTFOO_VERSION}\n"),
    )

    def install(location: Path, package: str) -> None:
        sdk = location.joinpath(*package.split("/"))
        sdk.mkdir(parents=True)
        (sdk / "package.json").write_text('{"version": "1.2.3"}')

    return SimpleNamespace(install_root=install_root, bundled=bundled, install=install)


@pytest.mark.parametrize("runtime", ["claude", "codex", "opencode"])
def test_find_sdk_modules_resolves_the_hook_installed_copy(skill_eval_module, promptfoo_layout, runtime):
    promptfoo_layout.install(promptfoo_layout.install_root, skill_eval_module.SDK_PACKAGES[runtime])

    assert skill_eval_module.find_sdk_modules(runtime) == promptfoo_layout.install_root


@pytest.mark.parametrize("runtime", ["claude", "codex", "opencode"])
def test_find_sdk_modules_ignores_the_copy_bundled_with_promptfoo(
    skill_eval_module, promptfoo_layout, runtime
):
    promptfoo_layout.install(promptfoo_layout.bundled, skill_eval_module.SDK_PACKAGES[runtime])

    with pytest.raises(SystemExit) as exit_info:
        skill_eval_module.find_sdk_modules(runtime)

    assert exit_info.value.code == 1


def test_find_sdk_modules_requires_the_selected_runtimes_sdk(skill_eval_module, promptfoo_layout):
    promptfoo_layout.install(promptfoo_layout.install_root, skill_eval_module.SDK_PACKAGES["claude"])

    with pytest.raises(SystemExit) as exit_info:
        skill_eval_module.find_sdk_modules("codex")

    assert exit_info.value.code == 1
