#!/bin/zsh

set -e

cd "$(dirname "$0")" || exit 1

if ! grep -q '^GEMINI_API_KEY=.[^[:space:]]' .env.local 2>/dev/null; then
  api_key="$(osascript <<'APPLESCRIPT'
tell application "System Events"
  display dialog "Paste your Google Gemini API key to start the independent SORT RÁC app." & return & return & "The key is saved only in this project's local .env.local file." default answer "" with hidden answer buttons {"Cancel", "Save key"} default button "Save key" cancel button "Cancel"
  text returned of result
end tell
APPLESCRIPT
)"

  if [[ -z "$api_key" ]]; then
    exit 0
  fi

  if [[ -f .env.local ]]; then
    grep -v '^GEMINI_API_KEY=' .env.local > .env.local.tmp || true
  else
    : > .env.local.tmp
  fi
  printf 'GEMINI_API_KEY=%s\n' "$api_key" >> .env.local.tmp
  mv .env.local.tmp .env.local
  unset api_key
fi

export PATH="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"

if ! command -v pnpm >/dev/null 2>&1; then
  osascript -e 'display alert "SORT RÁC Google API" message "pnpm is not available on this Mac." as critical'
  exit 1
fi

osascript -e 'display notification "Starting the Google API test app..." with title "SORT RÁC"'
(sleep 1.2 && open "http://127.0.0.1:5186/") &
exec pnpm dev --host 127.0.0.1 --port 5186 --strictPort
