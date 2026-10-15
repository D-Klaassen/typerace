"use client";

import { useSyncExternalStore } from "react";
import { NO_DISPLAY_AIDS, type DisplayPreferences } from "./finger-guide";

const STORAGE_KEY = "typerace.display";
const listeners = new Set<() => void>();
/** The latest choice, also kept here for when storage is blocked. */
let memory: string | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memory;
  } catch {
    return memory;
  }
}

function parse(raw: string | null): DisplayPreferences {
  if (raw === null) {
    return NO_DISPLAY_AIDS;
  }
  try {
    const value = JSON.parse(raw) as Partial<DisplayPreferences>;

    return {
      fingerGuide: value.fingerGuide === true,
      keyboard: value.keyboard === true,
    };
  } catch {
    return NO_DISPLAY_AIDS;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * This browser's display choice for Online play, remembered between Rooms.
 * Falls back to "both off" when storage isn't available.
 */
export function useDisplayPreferences(): [
  DisplayPreferences,
  (next: DisplayPreferences) => void,
] {
  // The raw string is the snapshot, so React sees a stable value.
  const raw = useSyncExternalStore(subscribe, read, () => null);

  function update(next: DisplayPreferences) {
    memory = JSON.stringify(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, memory);
    } catch {
      // Storage blocked (e.g. private mode): the choice lasts until reload.
    }
    listeners.forEach((listener) => listener());
  }

  return [parse(raw), update];
}
