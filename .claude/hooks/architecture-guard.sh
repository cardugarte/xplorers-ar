#!/bin/bash
# Hook: Guardrail for Screaming Architecture
# Event: PreToolUse | Matcher: Write
# Asks confirmation when creating .ts/.tsx files outside valid locations

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only check TypeScript/TSX files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Valid locations for .ts/.tsx files (relative to project root)
# app/ — Expo Router pages/layouts
# src/domains/ — Screaming architecture bounded contexts
# src/shared/ — Shared cross-domain code
# src/infrastructure/ — External service adapters
# .claude/ — Claude skills and hooks
# __tests__/ or __mocks__/ — Test files anywhere
# *.test.ts(x) / *.spec.ts(x) — Test files
# *.d.ts — Type declarations

# Skip test files
if [[ "$FILE_PATH" =~ \.(test|spec)\.(ts|tsx)$ ]] || echo "$FILE_PATH" | grep -qE '(__tests__|__mocks__)/'; then
  exit 0
fi

# Skip type declarations
if [[ "$FILE_PATH" =~ \.d\.ts$ ]]; then
  exit 0
fi

# Skip config files at root level
FILENAME=$(basename "$FILE_PATH")
if [[ "$FILENAME" =~ ^(babel|metro|tailwind|nativewind-env|app\.config|tsconfig|jest\.config|env)\. ]]; then
  exit 0
fi

# Check if file is in a valid location
if echo "$FILE_PATH" | grep -qE '(^|/)app/' || \
   echo "$FILE_PATH" | grep -qE '(^|/)src/domains/' || \
   echo "$FILE_PATH" | grep -qE '(^|/)src/shared/' || \
   echo "$FILE_PATH" | grep -qE '(^|/)src/infrastructure/' || \
   echo "$FILE_PATH" | grep -qE '(^|/)\.claude/'; then
  exit 0
fi

# File is outside valid locations — ask for confirmation
jq -n --arg path "$FILE_PATH" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": ("File " + $path + " is outside the Screaming Architecture (app/, src/domains/, src/shared/, src/infrastructure/). Are you sure this is the right location?")
  }
}'
