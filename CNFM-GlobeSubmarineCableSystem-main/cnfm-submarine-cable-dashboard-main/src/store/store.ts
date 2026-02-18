// store.ts
import { create } from "zustand";

interface HoverStore {
  title: string;
  onHover: (title: string) => void;
}

export const useStore = create<HoverStore>((set) => ({
  title: '', // initial state
  onHover: (title: string) => set({ title }),
}));
