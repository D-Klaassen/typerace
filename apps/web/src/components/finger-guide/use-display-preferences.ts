"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_DISPLAY, type DisplayPreferences } from "./finger-guide";

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
    return DEFAULT_DISPLAY;
  }
  try {
    const value = JSON.parse(raw) as Partial<DisplayPreferences>;

    return {
      fingerGuide:
        typeof value.fingerGuide === "boolean"
          ? value.fingerGuide
          : DEFAULT_DISPLAY.fingerGuide,
      keyboard:
        typeof value.keyboard === "boolean"
          ? value.keyboard
          : DEFAULT_DISPLAY.keyboard,
    };
  } catch {
    return DEFAULT_DISPLAY;
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
 * Starts from DEFAULT_DISPLAY until the Player changes it.
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
