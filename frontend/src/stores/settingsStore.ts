import { create } from "zustand";
import * as tauri from "@/lib/tauri";

interface SettingsState {
  storageMode: "local" | "cloud";
  cloudConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  setStorageMode: (mode: "local" | "cloud") => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storageMode: "local",
  cloudConfigured: false,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await tauri.getSettings();
      set({
        storageMode: result.storageMode as "local" | "cloud",
        cloudConfigured: result.cloudConfigured as boolean,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  setStorageMode: async (mode) => {
    set({ isLoading: true, error: null });
    try {
      await tauri.updateStorageMode(mode);
      set({ storageMode: mode, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));
