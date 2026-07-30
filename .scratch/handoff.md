# Handoff — 2026-06-08 17:16

## Repo

/Users/jleemon/src/github.com/nomeelnoj/pi-powerline-footer

## Task

Fix Ctrl+Alt shortcuts (powerline + pi-copy-code) silently dying after `/reload`; root-caused to powerline disabling the terminal's Kitty keyboard protocol on `session_shutdown`.

## Status

- Root cause CONFIRMED via key-probe bytes: `/reload` fires `session_shutdown`; powerline's handler reset extended keyboard modes (pop-all `\e[<999u`), popping pi-core's Kitty frame → terminal reverts to legacy `ESC+Ctrl-char` → `matchesKey` fails for all Ctrl+Alt keys. pi-core never re-handshakes on reload. copy-code (core `pi.registerShortcut`) has no fallback so it breaks; powerline's own survive via `matchesConfiguredShortcut` legacy fallback.
- `fixedEditor:false` (default + Jon's config): reload bug FIXED by both the resync extension and the branch fixes below.
- `fixedEditor:true`: still broken on FRESH start (separate pre-existing compositor-init race — compositor snapshots keyboard mode before pi-core's ~150ms Kitty handshake). NOT yet fixed.
- WORKING NOW: checkout on `local/both-session-name-and-shortcuts` (session-name fix + shortcut legacy fallback + original quit-cleanup = clean exit). Jon is reactivating the `zz-kitty-resync` extension (proven reload fix, lives in his dotfiles).
- `~/.pi/agent/extensions/zz-keyprobe.ts` (diagnostic, filters mouse/release) still installed; `zz-kitty-resync.ts` symlinked from dotfiles.
- Added `fix_corrupted_shell()` to dotfiles `~/src/github.com/nomeelnoj/dotfiles/zsh/.zshrc` (needs `source`).
- UPSTREAM (`nicobailon`): now v0.6.1, already contains smoosex's PR #71 reason-gating VERBATIM in commit `88fb0fd`, no credit/merge. Jon's own #76 is NOT in upstream. Jon lost interest in upstreaming.

## Key files

- `index.ts` — `session_shutdown` handler (~line 1253) + `teardownFixedEditorCompositor` (~line 2247): where reset happens.
- `fixed-editor/terminal-split.ts` — compositor; `emergencyTerminalModeReset()` (`\e[<999u\e[>4;0m`), `enableAlternateScreenKeyboardMode` (init race for fixedEditor:true).
- `tests/jump-shortcuts.test.ts` — source-grep regression tests for the shutdown behavior.

## Branches

- `local/both-session-name-and-shortcuts` — CURRENT, safe to run (resets on quit = clean exit).
- `fix/reload-keyboard-protocol-reset` (`eac21f8`) — ownership-model attempt; DO NOT RUN (resets on nothing → corrupts shell on exit). Needs rework to quit-only reset.
- `fix/session-name-parsing` (#76), `fix/shortcuts-legacy-ctrl-alt` — PR branches, intact. PRs #1/#2 open on Jon's fork.

## Next action

Sync fork `main` onto upstream `v0.6.1` (pulls in #71's reason-gating), then rework the reload fix as **reset on `reason === "quit"` ONLY** (preserve on reload/resume/new/fork) AND restore the no-compositor `emergencyTerminalModeReset` for the quit path so exit stays clean. Then tackle `fixedEditor:true` fresh-start via deferred compositor install (wait for Kitty handshake, ~300ms grace then install anyway).

## Blockers / notes

- Do NOT run `fix/reload-keyboard-protocol-reset` — corrupts shell on exit (no quit-cleanup).
- Test loop bricks the terminal in `fixedEditor:true`; rescue with `fix_corrupted_shell` (or raw `printf '\e[<999u\e[>4;0m\e[?1000l\e[?1002l\e[?1003l\e[?1006l\e[?2004l\e[?1049l'`).
- Always test in a BRAND-NEW Ghostty/iTerm window (reused tabs stay contaminated) and disable `zz-kitty-resync` while testing the source fix (it masks the bug).
