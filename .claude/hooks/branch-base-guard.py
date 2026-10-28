#!/usr/bin/env python3
"""branch-base-guard.py — PreToolUse hook (matcher: Bash)

Blocks creating a git branch from a STALE base, so branches are never "born
behind". The base is resolved from the command itself:

  • explicit start-point  (e.g. `git checkout -b child feat/parent`) → that ref
  • no start-point        (e.g. `git checkout -b feat/x`)            → current branch

Rules:
  • Branching off a remote ref directly (`origin/...`) is always fresh → allow.
  • For a LOCAL branch base, compare it to `origin/<base>`; if the local base is
    behind its remote, DENY with the exact remediation command.
  • Anything we can't judge (tag/sha base, no remote counterpart) → allow.

Stacked PRs work naturally: branch off the parent's remote tip
(`git checkout -b child origin/feat/parent`) and the guard stays out of the way.

Contract: exit 0 always; emit a PreToolUse `permissionDecision: "deny"` JSON to
block. A crash must not wedge the session, so unexpected errors fall through to
allow.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import NoReturn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _branchlib import parse_branch_creations  # noqa: E402


def _allow() -> NoReturn:
    sys.exit(0)


def _deny(reason: str) -> NoReturn:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )
    sys.exit(0)


def _git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], capture_output=True, text=True)


def _is_local_branch(name: str) -> bool:
    return _git("show-ref", "--verify", "--quiet", f"refs/heads/{name}").returncode == 0


def _has_remote_branch(name: str) -> bool:
    return (
        _git("show-ref", "--verify", "--quiet", f"refs/remotes/origin/{name}").returncode == 0
    )


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        _allow()

    if data.get("tool_name") != "Bash":
        _allow()
    command = (data.get("tool_input") or {}).get("command", "")
    if not command:
        _allow()

    creations = parse_branch_creations(command)
    if not creations:
        _allow()

    current = _git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip() or "HEAD"

    problems: list[tuple[str, str, int]] = []
    for new, start in creations:
        base = start if start else current
        if base.startswith("origin/"):
            continue  # branching off a remote tip is fresh by definition
        if not _is_local_branch(base):
            continue  # tag / sha / detached — don't guess
        # Best-effort refresh of just this base; never block on fetch failure.
        subprocess.run(
            ["git", "fetch", "origin", base, "--quiet"], capture_output=True, text=True
        )
        if not _has_remote_branch(base):
            continue  # no remote counterpart to compare against
        out = _git("rev-list", "--count", f"{base}..origin/{base}").stdout.strip()
        try:
            behind = int(out)
        except ValueError:
            continue
        if behind > 0:
            problems.append((new, base, behind))

    if not problems:
        _allow()

    lines = ["Blocked: about to create a branch from a STALE base.", ""]
    for new, base, behind in problems:
        lines.append(
            f"  • '{new}' would fork from local '{base}', which is {behind} "
            f"commit(s) behind 'origin/{base}'."
        )
    new0, base0, _ = problems[0]
    lines += [
        "",
        "Update the base first, then re-run — either:",
        f"  git fetch origin && git checkout {base0} && git pull",
        "  # or branch straight off the remote tip (no local update needed):",
        f"  git checkout -b {new0} origin/{base0}",
        "",
        "For a stacked PR, branch off the PARENT branch's remote tip, not master.",
    ]
    _deny("\n".join(lines))


if __name__ == "__main__":
    main()
