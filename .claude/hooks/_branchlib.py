"""Shared parsing for branch-creating git commands.

Used by the branch-base guard (PreToolUse) and recorder (PostToolUse) hooks.
Pure parsing — no git calls here — so it is trivially testable in isolation
(see test_branchlib.py).
"""

from __future__ import annotations

import re
import shlex

# Flags on checkout/switch that request branch creation.
_BRANCH_CREATE_FLAGS = {"-b", "-B", "-c", "-C", "--create"}

# Global options that sit BEFORE the subcommand (`git -C <path> checkout ...`).
# The ones here consume a following value token; other leading "-" options are
# treated as valueless. Skipping these lets us find the real subcommand instead
# of mistaking the option for it (which silently bypassed both hooks).
_GLOBAL_OPTS_WITH_ARG = {
    "-C",
    "-c",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--exec-path",
    "--super-prefix",
    "--config-env",
}


def _segments(command: str) -> list[str]:
    """Split a compound shell command into rough segments on &&, ||, ;, newline.

    A bare ``|`` is intentionally NOT a separator: branch-creation is never the
    receiving end of a pipe, and splitting on it would mangle quoted pipes.
    """
    return [s.strip() for s in re.split(r"&&|\|\||;|\n", command) if s.strip()]


def _tokens(segment: str) -> list[str]:
    try:
        return shlex.split(segment)
    except ValueError:
        return segment.split()


def _subcommand(toks: list[str]) -> tuple[str | None, list[str]]:
    """From ``git [global-opts...] <sub> [args...]`` return ``(sub, args)``,
    skipping leading global options. ``(None, [])`` if there is no subcommand."""
    i = 1
    n = len(toks)
    while i < n and toks[i].startswith("-"):
        opt = toks[i]
        if "=" in opt:  # e.g. --git-dir=foo / -c is rarely written this way
            i += 1
        elif opt in _GLOBAL_OPTS_WITH_ARG:
            i += 2  # option plus its value token
        else:
            i += 1
    if i >= n:
        return None, []
    return toks[i], toks[i + 1 :]


def parse_branch_creations(command: str) -> list[tuple[str, str | None]]:
    """Return ``[(new_branch, start_point_or_None), ...]`` for every
    branch-creating git subcommand found in ``command``. Empty if none.

    Handles ``git checkout -b/-B``, ``git switch -c/-C/--create``, and the
    ``git branch [-f|--force] <new> [<start>]`` create form. Leading global
    options (``git -C <path> ...``, ``git -c k=v ...``) are skipped first.
    """
    results: list[tuple[str, str | None]] = []
    for seg in _segments(command):
        toks = _tokens(seg)
        if len(toks) < 2 or toks[0] != "git":
            continue
        sub, args = _subcommand(toks)
        if sub is None:
            continue

        if sub in ("checkout", "switch"):
            create = False
            positional: list[str] = []
            for a in args:
                if a in _BRANCH_CREATE_FLAGS:
                    create = True
                elif not a.startswith("-"):
                    positional.append(a)
                # other flags ignored
            if create and positional:
                new = positional[0]
                start = positional[1] if len(positional) > 1 else None
                results.append((new, start))

        elif sub == "branch":
            # Create form: `git branch [-f|--force] <new> [<start>]`. Force-create
            # is still a create, so we honour -f/--force; any OTHER flag (delete,
            # move, copy, list, verbose, ...) means this isn't a plain create and
            # we skip it (fail-open).
            positional = []
            disqualified = False
            for a in args:
                if a in ("-f", "--force"):
                    continue
                if a.startswith("-"):
                    disqualified = True
                    break
                positional.append(a)
            if not disqualified and positional:
                new = positional[0]
                start = positional[1] if len(positional) > 1 else None
                results.append((new, start))

    return results
