#!/usr/bin/env python3
"""Unit tests for _branchlib.parse_branch_creations.

Standalone so it needs no pytest: ``python3 .claude/hooks/test_branchlib.py``
exits non-zero if any case fails. Run directly, or via the dedicated
"Claude hooks (parser tests)" job in .github/workflows/pr-checks.yml.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _branchlib import parse_branch_creations as p  # noqa: E402

CASES: list[tuple[str, list[tuple[str, str | None]]]] = [
    # checkout / switch create forms
    ("git checkout -b feat/x", [("feat/x", None)]),
    ("git checkout -b feat/x origin/master", [("feat/x", "origin/master")]),
    ("git switch -c child feat/parent", [("child", "feat/parent")]),
    ("git switch --create child", [("child", None)]),
    ("git checkout -B feat/y main", [("feat/y", "main")]),
    # plain `git branch` create form (and force-create)
    ("git branch newb origin/feat/parent", [("newb", "origin/feat/parent")]),
    ("git branch -f x origin/main", [("x", "origin/main")]),
    # non-create / unrelated → nothing
    ("git branch -d oldb", []),
    ("git branch", []),
    ("git branch -a", []),
    ("git checkout main", []),
    ("git status", []),
    ("ls -la", []),
    # leading global options must not hide the subcommand
    ("git -C /path checkout -b x", [("x", None)]),
    ("git -c k=v checkout -b x feat/p", [("x", "feat/p")]),
    ("git --git-dir=/r/.git switch -c y", [("y", None)]),
    # compound commands
    ("git fetch origin && git checkout -b feat/z origin/master", [("feat/z", "origin/master")]),
]


def main() -> None:
    failures = []
    for cmd, expected in CASES:
        got = p(cmd)
        if got != expected:
            failures.append((cmd, expected, got))
    for cmd, expected, got in failures:
        print(f"FAIL: {cmd!r} -> {got} (expected {expected})")
    passed = len(CASES) - len(failures)
    print(f"{passed}/{len(CASES)} passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
