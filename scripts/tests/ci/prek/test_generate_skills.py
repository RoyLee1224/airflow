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

from ci.prek.generate_skills import (
    collect_command_groups,
    generate_skill_map,
    render_command_sections,
    write_or_check_generated_skills,
)


def test_collect_command_groups_picks_up_airflow_contribution_blocks():
    skills = collect_command_groups()

    assert "airflow-contribution" in skills
    categories = {group.category for group in skills["airflow-contribution"]}
    assert categories >= {"static-checks", "targeted-tests", "suite-tests", "change-scoping"}


def test_render_command_sections_includes_group_tables():
    command_groups = collect_command_groups()["airflow-contribution"]

    rendered = render_command_sections(command_groups)

    assert "Static checks (host only)" in rendered
    assert "| Task | Command | Notes |" in rendered
    assert "`prek run --from-ref <target_branch> --stage pre-commit`" in rendered


def test_generate_skill_map_renders_template_with_synced_commands():
    generated = generate_skill_map()
    skill_path = next(path for path in generated if path.name == "SKILL.md")

    rendered = generated[skill_path]

    assert "The contributing docs are the single source of truth" in rendered
    assert "Synced Command Reference" in rendered
    assert "`breeze selective-checks --commit-ref <commit_sha>`" in rendered
    assert "`contributing-docs/testing/unit_tests.rst`" in rendered


def test_write_or_check_generated_skills_reports_stale_file(tmp_path):
    skill_dir = tmp_path / ".agents" / "skills" / "airflow-contribution"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.template.md").write_text(
        "---\nname: airflow-contribution\ndescription: test\n---\n\n$generated_command_sections\n"
    )
    (skill_dir / "SKILL.md").write_text("stale\n")
    docs_dir = tmp_path / "contributing-docs"
    docs_dir.mkdir()
    (docs_dir / "testing.rst").write_text(
        """
.. AGENT-SKILL-START
   type: command-group
   skill: airflow-contribution
   category: test
   title: Test Commands
   order: 10
   commands:
     - task: Run tests
       command: uv run pytest
       notes: Host
.. AGENT-SKILL-END
"""
    )

    result = write_or_check_generated_skills(
        airflow_root=tmp_path,
        contributing_docs_root=docs_dir,
        check=True,
    )

    assert result == 1
