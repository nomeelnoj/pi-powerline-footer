import { matchesKey } from "@earendil-works/pi-tui";

const SUPER_SHORTCUT_PATTERNS = new Map<string, RegExp>([
  ["super+up", /^\x1b\[(?:1;9(?::[12])?[AH]|574(?:19|23);9(?::[12])?u|7;9(?::[12])?~|27;9;65~)$/],
  ["super+down", /^\x1b\[(?:1;9(?::[12])?[BF]|574(?:20|24);9(?::[12])?u|8;9(?::[12])?~|27;9;66~)$/],
  ["super+home", /^\x1b\[(?:1;9(?::[12])?H|57423;9(?::[12])?u|7;9(?::[12])?~)$/],
  ["super+end", /^\x1b\[(?:1;9(?::[12])?F|57424;9(?::[12])?u|8;9(?::[12])?~)$/],
  ["super+pageup", /^\x1b\[(?:5;9(?::[12])?~|57421;9(?::[12])?u)$/],
  ["super+pagedown", /^\x1b\[(?:6;9(?::[12])?~|57422;9(?::[12])?u)$/],
  ["super+shift+up", /^\x1b\[(?:1;10(?::[12])?[AH]|574(?:19|23);10(?::[12])?u|7;10(?::[12])?~|27;10;65~)$/],
  ["super+shift+down", /^\x1b\[(?:1;10(?::[12])?[BF]|574(?:20|24);10(?::[12])?u|8;10(?::[12])?~|27;10;66~)$/],
  ["super+shift+home", /^\x1b\[(?:1;10(?::[12])?H|57423;10(?::[12])?u|7;10(?::[12])?~)$/],
  ["super+shift+end", /^\x1b\[(?:1;10(?::[12])?F|57424;10(?::[12])?u|8;10(?::[12])?~)$/],
]);

export function shortcutUsesSuper(shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+");
  return parts.slice(0, -1).includes("super");
}

export function isSupportedSuperShortcut(shortcut: string): boolean {
  return SUPER_SHORTCUT_PATTERNS.has(shortcut.toLowerCase());
}

export function shortcutConflictKey(shortcut: string): string {
  switch (shortcut.toLowerCase()) {
    case "super+home":
      return "super+up";
    case "super+end":
      return "super+down";
    case "super+shift+home":
      return "super+shift+up";
    case "super+shift+end":
      return "super+shift+down";
    default:
      return shortcut;
  }
}

export function matchesConfiguredShortcut(data: string, shortcut: string): boolean {
  const normalizedShortcut = shortcut.toLowerCase();
  if (shortcutUsesSuper(normalizedShortcut)) {
    return SUPER_SHORTCUT_PATTERNS.get(normalizedShortcut)?.test(data) ?? false;
  }

  if (matchesKey(data, shortcut)) {
    return true;
  }

  // Legacy fallback for ctrl+alt+<letter>.
  //
  // Some sessions deliver these as ESC + control-char (e.g. "\x1b\x05" for
  // ctrl+alt+e) when the Kitty keyboard protocol is not active at the terminal
  // level. matchesKey only accepts that legacy form while its internal
  // kitty-protocol flag is false, but that flag can desync from the real
  // terminal state — notably inside the fixed-editor compositor, where the
  // terminal reverts to legacy encoding while the flag stays true. Accept the
  // legacy encoding explicitly so these shortcuts keep working either way.
  return matchesLegacyCtrlAltLetter(data, normalizedShortcut);
}

function matchesLegacyCtrlAltLetter(data: string, normalizedShortcut: string): boolean {
  const parts = normalizedShortcut.split("+");
  if (parts.length !== 3 || parts[0] !== "ctrl" || parts[1] !== "alt") {
    return false;
  }

  const key = parts[2];
  if (key.length !== 1 || key < "a" || key > "z") {
    return false;
  }

  const controlChar = String.fromCharCode(key.charCodeAt(0) & 0x1f);
  return data === `\x1b${controlChar}`;
}
