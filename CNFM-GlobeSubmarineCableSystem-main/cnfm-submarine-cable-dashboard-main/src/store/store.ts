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


export const useStore = create<HoverStore>((set) => ({
  title: '', // initial state
  onHover: (title: string) => set({ title }),
}));

export const changeSimulator = create<ChangeNav>((set)=> ({
  nav: 'Global',
  onChangeNav: (nav: string) => set({nav}),

}));