import test from "node:test";
import assert from "node:assert/strict";

import { matchesConfiguredShortcut } from "../shortcuts.ts";
import { setKittyProtocolActive } from "@earendil-works/pi-tui";

// Legacy ctrl+alt+<letter> sequences (ESC + control-char). Some sessions emit
// these instead of the Kitty CSI-u form when the Kitty keyboard protocol is not
// active at the terminal level — notably inside the fixed-editor compositor,
// where matchesKey's internal kitty flag can desync from the real terminal.
const LEGACY_CTRL_ALT_E = "\x1b\x05";
const LEGACY_CTRL_ALT_X = "\x1b\x18";
const LEGACY_CTRL_ALT_H = "\x1b\x08";
const KITTY_CTRL_ALT_E = "\x1b[101;7u";

for (const kittyActive of [true, false]) {
  test(`ctrl+alt+<letter> matches legacy ESC+ctrl form (kittyActive=${kittyActive})`, () => {
    setKittyProtocolActive(kittyActive);
    try {
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_E, "ctrl+alt+e"), true);
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_X, "ctrl+alt+x"), true);
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_H, "ctrl+alt+h"), true);
      // Kitty CSI-u form must continue to match regardless of the legacy fallback.
      assert.equal(matchesConfiguredShortcut(KITTY_CTRL_ALT_E, "ctrl+alt+e"), true);
    } finally {
      setKittyProtocolActive(false);
    }
  });

  test(`legacy fallback does not over-match (kittyActive=${kittyActive})`, () => {
    setKittyProtocolActive(kittyActive);
    try {
      // Wrong letter must not match.
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_E, "ctrl+alt+x"), false);
      // Plain ctrl+e (no ESC prefix) is not ctrl+alt+e.
      assert.equal(matchesConfiguredShortcut("\x05", "ctrl+alt+e"), false);
      // The fallback is scoped to ctrl+alt only, not bare alt or ctrl.
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_E, "alt+e"), false);
      assert.equal(matchesConfiguredShortcut(LEGACY_CTRL_ALT_E, "ctrl+e"), false);
    } finally {
      setKittyProtocolActive(false);
    }
  });
}
