// store.ts
import { title } from "node:process";
import { create } from "zustand";

interface HoverStore {
  title: string;
  onHover: (title: string) => void;
}

interface ChangeNav{
  nav:String,
  onChangeNav: (nav: string) => void;
}

interface CableId {
  cut_id: string[];
  onCutId: (cut_id: string[]) => void;
}

export const useStore = create<HoverStore>((set) => ({
  title: '', // initial state
  onHover: (title: string) => set({ title }),
}));

export const changeSimulator = create<ChangeNav>((set)=> ({
  nav: 'Global',
  onChangeNav: (nav: string) => set({nav}),

}));

export const useCableId = create<CableId>((set)=> ({
  cut_id: [],
  onCutId: (cut_id: string[]) => set({cut_id}),
}));