#!/bin/bash
# Hook: Protect .env files from editing/writing
# Event: PreToolUse | Matcher: Edit|Write
# Blocks modification of .env files — suggest .env.example instead

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Get just the filename
FILENAME=$(basename "$FILE_PATH")

# Allow .env.example (safe to edit)
if [[ "$FILENAME" == ".env.example" ]]; then
  exit 0
fi

# Check if it's a .env file
if [[ "$FILENAME" == ".env" || "$FILENAME" == ".env.local" || "$FILENAME" == ".env.production" || "$FILENAME" == ".env.development" || "$FILENAME" =~ ^\.env\. ]]; then
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "Editing .env files is blocked to protect secrets (Supabase, Mapbox keys). Edit .env.example instead and let the user update .env manually."
    }
  }'
  exit 0
fi

exit 0
