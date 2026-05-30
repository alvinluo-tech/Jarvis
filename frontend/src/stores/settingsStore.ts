import { create } from "zustand";
import * as tauri from "@/lib/tauri";

interface SettingsState {
  storageMode: "local" | "cloud";
  cloudConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  dbStats: tauri.DbStats | null;
  isLoadingDbStats: boolean;
  fetchSettings: () => Promise<void>;
  setStorageMode: (mode: "local" | "cloud") => Promise<void>;
  fetchDbStats: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storageMode: "local",
  cloudConfigured: false,
  isLoading: false,
  error: null,
  dbStats: null,
  isLoadingDbStats: false,

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

  fetchDbStats: async () => {
    set({ isLoadingDbStats: true });
    try {
      const stats = await tauri.getDbStats();
      set({ dbStats: stats, isLoadingDbStats: false });
    } catch (error) {
      console.error("Failed to fetch db stats:", error);
      set({ isLoadingDbStats: false });
    }
  },
}));

