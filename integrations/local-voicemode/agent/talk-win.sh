#!/usr/bin/env bash
# LifeOS voice bridge for agents whose shell is Git Bash on Windows (Claude Code's Bash tool).
#
#   talk-win.sh speak 'Reply to say aloud'    # speak, then print what the user says next
#   talk-win.sh notify 'Working on it.'       # speak only; the microphone stays closed
#   talk-win.sh listen                         # print what the user says
#   talk-win.sh status | devices
#   printf '%s' "$reply" | talk-win.sh speak -   # read the text from stdin
#
# The text travels through a temporary UTF-8 file, so quotes, apostrophes, leading
# slashes and non-ASCII characters reach the Windows voice client unchanged.
set -u

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
command="${1:-listen}"
if [ "$#" -gt 0 ]; then shift; fi

text_file=""
cleanup() {
  if [ -n "$text_file" ]; then rm -f "$text_file"; fi
}
trap cleanup EXIT

case "$command" in
  speak|notify)
    text_file="$(mktemp)"
    if [ "$#" -eq 1 ] && [ "$1" = "-" ]; then
      cat > "$text_file"
    else
      printf '%s' "$*" > "$text_file"
    fi
    ;;
  listen|status|devices) ;;
  *)
    echo "[talk] usage: talk-win.sh speak|notify|listen|status|devices [text]" >&2
    exit 2
    ;;
esac

client="$(cygpath -w "$here/Invoke-Talk.ps1")"
if [ -n "$text_file" ]; then
  powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$client" "$command" -TextFile "$(cygpath -w "$text_file")"
else
  powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$client" "$command"
fi
exit $?
