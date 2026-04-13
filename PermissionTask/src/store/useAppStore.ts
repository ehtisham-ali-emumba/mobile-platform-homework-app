import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { ActivityEntry, Command } from "@/src/agent/types";

type AppState = {
  preferences: { darkMode: boolean };
  activityLog: ActivityEntry[];
  flyoutState: { open: boolean; prefilledPrompt?: string };
  exploreFilter: { filter: string; sort: "asc" | "desc" };
  pendingCommand: Command | null;
  setPreference: (key: "darkMode", value: boolean) => void;
  setExploreFilter: (
    params: Partial<{ filter: string; sort: "asc" | "desc" }>,
  ) => void;
  setFlyoutState: (
    params: Partial<{ open: boolean; prefilledPrompt?: string }>,
  ) => void;
  addActivityLog: (entry: ActivityEntry) => void;
  setPendingCommand: (command: Command | null) => void;
};

const memoryStore = new Map<string, string>();

const fallbackStorage: StateStorage = {
  getItem: (name) => memoryStore.get(name) ?? null,
  setItem: (name, value) => {
    memoryStore.set(name, value);
  },
  removeItem: (name) => {
    memoryStore.delete(name);
  },
};

function resolveStorage(): StateStorage {
  try {
    // Avoid hard import crash when native module is not linked yet.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asyncStorageModule = require("@react-native-async-storage/async-storage");
    const asyncStorage = asyncStorageModule?.default;

    if (
      asyncStorage &&
      typeof asyncStorage.getItem === "function" &&
      typeof asyncStorage.setItem === "function" &&
      typeof asyncStorage.removeItem === "function"
    ) {
      return asyncStorage as StateStorage;
    }
  } catch {
    // Fall through to in-memory storage.
  }

  return fallbackStorage;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: { darkMode: false },
      activityLog: [],
      flyoutState: { open: false },
      exploreFilter: { filter: "all", sort: "asc" },
      pendingCommand: null,
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
      setExploreFilter: (params) =>
        set((state) => ({
          exploreFilter: {
            filter: params.filter ?? state.exploreFilter.filter,
            sort: params.sort ?? state.exploreFilter.sort,
          },
        })),
      setFlyoutState: (params) =>
        set((state) => ({
          flyoutState: {
            open: params.open ?? state.flyoutState.open,
            prefilledPrompt:
              params.prefilledPrompt ?? state.flyoutState.prefilledPrompt,
          },
        })),
      addActivityLog: (entry) =>
        set((state) => ({
          activityLog: [...state.activityLog, entry],
        })),
      setPendingCommand: (command) => set({ pendingCommand: command }),
    }),
    {
      name: "permission-task-store",
      storage: createJSONStorage(resolveStorage),
    },
  ),
);
