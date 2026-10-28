#!/usr/bin/env bash
#
# branch-staleness-notice.sh — SessionStart hook
#
# Non-blocking awareness: at session start, report how far the current branch is
# behind its base (the recorded `branch.<name>.basebranch`, or main by
# default). For a stack member it also notes how far the base itself trails
# master — expected until the base PR merges, so it's FYI only.
#
# Companion to branch-base-guard.py (which BLOCKS born-stale branch creation);
# this one just surfaces drift on a branch you're already sitting on.
#
# Contract: exit 0; emit `{"systemMessage": "..."}` on stdout to surface a note.
# Stay silent (no output) when there's nothing to report.

set -uo pipefail

# Drain stdin (hook input JSON); we don't need its fields here.
cat >/dev/null 2>&1 || true

cur=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
[ -z "$cur" ] && exit 0
[ "$cur" = "HEAD" ] && exit 0  # detached HEAD — nothing meaningful to compare

base=$(git config "branch.$cur.basebranch" 2>/dev/null || true)
[ -z "$base" ] && base="main"

# Best-effort refresh in a SINGLE fetch; never fail the session on a hiccup.
# For a non-default base we also need origin/master for the whole-stack note.
case "$base" in
  master|main) git fetch origin "$base" --quiet 2>/dev/null || true ;;
  *) git fetch origin "$base" main --quiet 2>/dev/null || true ;;
esac

remote="origin/$base"
git show-ref --verify --quiet "refs/remotes/$remote" 2>/dev/null || exit 0

behind=$(git rev-list --count "$cur..$remote" 2>/dev/null || echo 0)

msg=""
if [ "${behind:-0}" -gt 0 ] 2>/dev/null; then
  if [ "$cur" = "$base" ]; then
    msg="Branch '$cur' is $behind commit(s) behind 'origin/$base'. Run: git pull"
  else
    msg="Branch '$cur' is $behind commit(s) behind its base 'origin/$base'. Consider: git merge origin/$base"
  fi
fi

# Whole-stack drift (FYI only) for a non-default base.
case "$base" in
  master|main) ;;
  *)
    if git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
      sbehind=$(git rev-list --count "$remote..origin/main" 2>/dev/null || echo 0)
      if [ "${sbehind:-0}" -gt 0 ] 2>/dev/null; then
        extra="(FYI: stack base '$base' is $sbehind behind origin/main — normal for a stacked PR until it merges.)"
        msg="${msg:+$msg }$extra"
      fi
    fi
    ;;
esac

[ -z "$msg" ] && exit 0
# Emit JSON via python3 (already required by the sibling hooks) so this script
# carries no extra dependency on jq.
python3 -c 'import json,sys; print(json.dumps({"systemMessage": sys.argv[1]}))' "$msg"
exit 0
