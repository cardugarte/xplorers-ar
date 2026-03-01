#!/bin/bash
# Hook: Run typecheck when Claude finishes
# Event: Stop
# Only quality gate available (no ESLint/tests). Blocks Stop on errors.

INPUT=$(cat)

# Guard against infinite loops: check if we're already in a typecheck cycle
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
MARKER="/tmp/xplorers-typecheck-$$"

# Use a project-level marker to detect loops
LOOP_MARKER="/tmp/xplorers-typecheck-loop"
if [[ -f "$LOOP_MARKER" ]]; then
  LAST_RUN=$(cat "$LOOP_MARKER")
  NOW=$(date +%s)
  # If last run was less than 30 seconds ago, we're likely in a loop
  if (( NOW - LAST_RUN < 30 )); then
    rm -f "$LOOP_MARKER"
    exit 0  # Allow stop to prevent infinite loop
  fi
fi

# Record this run
date +%s > "$LOOP_MARKER"

# Run typecheck from project root
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="/Users/zuricata/Documents/dev/xplorers"
fi

cd "$PROJECT_DIR" || exit 0

TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

# Clean up loop marker on success
if [[ $TSC_EXIT -eq 0 ]]; then
  rm -f "$LOOP_MARKER"
  exit 0
fi

# Type errors found — block stop
ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS")
ERRORS=$(echo "$TSC_OUTPUT" | grep "error TS" | head -20)

jq -n --arg reason "TypeScript found $ERROR_COUNT error(s). Fix them before finishing:\n$ERRORS" '{
  "decision": "block",
  "reason": $reason
}'
