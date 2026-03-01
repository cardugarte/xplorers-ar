#!/bin/bash
# Hook: Protect existing Supabase migrations from editing
# Event: PreToolUse | Matcher: Edit
# Existing migrations are immutable once applied. Create new ones instead.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Check if the file is inside supabase/migrations/
if echo "$FILE_PATH" | grep -q 'supabase/migrations/'; then
  # Only block if the file already exists (Edit on existing migration)
  if [[ -f "$FILE_PATH" ]]; then
    jq -n '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "Existing migrations are immutable — they have already been applied to the database. Create a new migration instead with `npm run db:migration:new <name>`."
      }
    }'
    exit 0
  fi
fi

exit 0
