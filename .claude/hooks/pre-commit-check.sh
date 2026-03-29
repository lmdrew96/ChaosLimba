#!/bin/bash

# Only run checks on git commit commands
INPUT=$(cat -)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if echo "$COMMAND" | grep -q "git commit"; then
  # Run type check, lint, and build
  cd "/Users/nae/Desktop/Language Learning/ChaosLimba"

  ERRORS=""

  npx tsc --noEmit 2>&1
  if [ $? -ne 0 ]; then
    ERRORS="${ERRORS}TypeScript check failed. "
  fi

  npx next lint 2>&1
  if [ $? -ne 0 ]; then
    ERRORS="${ERRORS}Lint check failed. "
  fi

  npx next build 2>&1
  if [ $? -ne 0 ]; then
    ERRORS="${ERRORS}Build failed. "
  fi

  if [ -n "$ERRORS" ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"${ERRORS}Fix these before committing.\"}}"
    exit 0
  fi
fi

# Allow everything else (non-commit commands, or if all checks pass)
echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\"}}"
