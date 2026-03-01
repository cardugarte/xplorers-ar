#!/bin/bash
# Hook: Re-inject context after compaction
# Event: SessionStart | Matcher: compact
# Restores essential project context that gets lost during compaction

INPUT=$(cat)
SOURCE=$(echo "$INPUT" | jq -r '.source // empty')

# Only run after compaction
if [[ "$SOURCE" != "compact" ]]; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="/Users/zuricata/Documents/dev/xplorers"
fi

cd "$PROJECT_DIR" || exit 0

# Gather context
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
MODIFIED=$(git diff --name-only 2>/dev/null | head -20)
STAGED=$(git diff --cached --name-only 2>/dev/null | head -20)
DOMAINS=$(ls src/domains/ 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

# Build context message
CONTEXT="## Post-Compaction Context Restore

**Project**: Xplorers — Camping directory app for Argentina
**Phase**: Fase 1 — MVP Directorio
**Branch**: $BRANCH
**Architecture**: Screaming Architecture with bounded domains in src/domains/

**Active domains**: $DOMAINS

**Key rules**:
- No ESLint/Prettier — only quality gate is \`npx tsc --noEmit\`
- Conventional commits only, NO Co-Authored-By
- Use bat/rg/fd/sd/eza instead of cat/grep/find/sed/ls
- Stack: Expo SDK 55, NativeWind v4 + TW3, Zustand 5, TanStack Query v5, Supabase PostGIS"

if [[ -n "$MODIFIED" ]]; then
  CONTEXT="$CONTEXT

**Modified files (unstaged)**:
$MODIFIED"
fi

if [[ -n "$STAGED" ]]; then
  CONTEXT="$CONTEXT

**Staged files**:
$STAGED"
fi

jq -n --arg ctx "$CONTEXT" '{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $ctx
  }
}'
