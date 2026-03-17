import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewMode = "grid" | "list";

interface UIStore {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            viewMode: "grid",
            setViewMode: (mode) => set({ viewMode: mode }),
        }),
        { name: "ui-preferences" } // localStorage key
    )
);
