#!/usr/bin/env python3
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
"""Generate agent skills from structured blocks embedded in contributing docs."""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from string import Template

import yaml

AIRFLOW_ROOT = Path(__file__).parents[3].resolve()
CONTRIBUTING_DOCS_ROOT = AIRFLOW_ROOT / "contributing-docs"
SKILLS_ROOT = AIRFLOW_ROOT / ".agents" / "skills"
BLOCK_RE = re.compile(r"\.\. AGENT-SKILL-START\n(.*?)\.\. AGENT-SKILL-END", re.DOTALL)


@dataclass(frozen=True)
class SkillCommand:
    task: str
    command: str
    notes: str


@dataclass(frozen=True)
class SkillCommandGroup:
    skill: str
    category: str
    title: str
    intro: str
    order: int
    source: Path
    commands: tuple[SkillCommand, ...]


def _dedent_rst_comment_body(raw: str) -> str:
    lines = raw.splitlines()
    return "\n".join(line[3:] if line.startswith("   ") else line for line in lines).strip()


def _parse_command_groups_from_rst(rst_path: Path, airflow_root: Path) -> list[SkillCommandGroup]:
    text = rst_path.read_text()
    command_groups: list[SkillCommandGroup] = []
    for match in BLOCK_RE.finditer(text):
        block = yaml.safe_load(_dedent_rst_comment_body(match.group(1)))
        if not isinstance(block, dict) or block.get("type") != "command-group":
            continue
        skill = str(block["skill"]).strip()
        category = str(block["category"]).strip()
        title = str(block["title"]).strip()
        intro = str(block.get("intro", "")).strip()
        order = int(block.get("order", 100))
        raw_commands = block.get("commands", [])
        commands = tuple(
            SkillCommand(
                task=str(command["task"]).strip(),
                command=str(command["command"]).strip(),
                notes=str(command.get("notes", "")).strip(),
            )
            for command in raw_commands
        )
        command_groups.append(
            SkillCommandGroup(
                skill=skill,
                category=category,
                title=title,
                intro=intro,
                order=order,
                source=rst_path.relative_to(airflow_root),
                commands=commands,
            )
        )
    return command_groups


def collect_command_groups(
    contributing_docs_root: Path = CONTRIBUTING_DOCS_ROOT,
    airflow_root: Path = AIRFLOW_ROOT,
) -> dict[str, list[SkillCommandGroup]]:
    skills: dict[str, list[SkillCommandGroup]] = defaultdict(list)
    for rst_path in sorted(contributing_docs_root.rglob("*.rst")):
        for command_group in _parse_command_groups_from_rst(rst_path, airflow_root):
            skills[command_group.skill].append(command_group)
    for groups in skills.values():
        groups.sort(key=lambda group: (group.order, group.category, group.title, str(group.source)))
    return skills


def _format_heading(title: str, marker: str = "-") -> str:
    return f"{title}\n{marker * len(title)}\n"


def _render_group(group: SkillCommandGroup) -> str:
    lines = [_format_heading(group.title)]
    lines.append(f"_Source: `{group.source}`_\n")
    if group.intro:
        lines.append(f"{group.intro}\n")
    lines.extend(
        [
            "| Task | Command | Notes |",
            "|------|---------|-------|",
        ]
    )
    for command in group.commands:
        lines.append(f"| {command.task} | `{command.command}` | {command.notes} |")
    lines.append("")
    return "\n".join(lines)


def render_command_sections(command_groups: list[SkillCommandGroup]) -> str:
    if not command_groups:
        return "_No generated command sections found._\n"
    return "\n".join(_render_group(group) for group in command_groups).rstrip() + "\n"


def render_source_list(command_groups: list[SkillCommandGroup]) -> str:
    sources = sorted({str(group.source) for group in command_groups})
    if not sources:
        return "- _No contributing docs sources found._\n"
    return "".join(f"- `{source}`\n" for source in sources)


def render_skill(skill_root: Path, command_groups: list[SkillCommandGroup]) -> str:
    template_path = skill_root / "SKILL.template.md"
    template = Template(template_path.read_text())
    return (
        template.substitute(
            generated_command_sections=render_command_sections(command_groups).rstrip(),
            generated_source_list=render_source_list(command_groups).rstrip(),
        ).rstrip()
        + "\n"
    )


def generate_skill_map(
    airflow_root: Path = AIRFLOW_ROOT, contributing_docs_root: Path = CONTRIBUTING_DOCS_ROOT
) -> dict[Path, str]:
    rendered_skills: dict[Path, str] = {}
    for skill_name, command_groups in collect_command_groups(
        contributing_docs_root, airflow_root=airflow_root
    ).items():
        skill_root = airflow_root / ".agents" / "skills" / skill_name
        rendered_skills[skill_root / "SKILL.md"] = render_skill(skill_root, command_groups)
    return rendered_skills


def write_or_check_generated_skills(
    airflow_root: Path = AIRFLOW_ROOT,
    contributing_docs_root: Path = CONTRIBUTING_DOCS_ROOT,
    *,
    check: bool,
) -> int:
    generated_skills = generate_skill_map(
        airflow_root=airflow_root, contributing_docs_root=contributing_docs_root
    )
    if not generated_skills:
        print("No agent skill blocks found in contributing docs.", file=sys.stderr)
        return 1
    stale_files: list[Path] = []
    for skill_path, content in generated_skills.items():
        if check:
            if not skill_path.exists() or skill_path.read_text() != content:
                stale_files.append(skill_path.relative_to(airflow_root))
            continue
        skill_path.write_text(content)
        print(f"wrote {skill_path.relative_to(airflow_root)}")
    if check and stale_files:
        print("Generated skill files are stale. Re-run scripts/ci/prek/generate_skills.py.", file=sys.stderr)
        for stale_file in stale_files:
            print(f"  stale: {stale_file}", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if generated skill files are stale.")
    args = parser.parse_args()
    return write_or_check_generated_skills(check=args.check)


if __name__ == "__main__":
    raise SystemExit(main())
