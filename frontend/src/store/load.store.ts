import { create } from "zustand";
import { Load, Role } from "@/types/load.types";
import { seedLoads } from "@/data/seed-loads";

type LoadStore = {
  loads: Load[];
  currentRole: Role;
  currentShipperId: string;
  setRole: (role: Role, shipperId?: string) => void;
  addLoad: (load: Load) => void;
  updateLoad: (id: string, load: Load) => void;
  deleteLoad: (id: string) => void;
};

export const useLoadStore = create<LoadStore>((set) => ({
  currentRole: "admin",
  currentShipperId: "s1",

  loads: seedLoads,

  setRole: (role, shipperId) =>
    set({ currentRole: role, currentShipperId: shipperId ?? "s1" }),

  addLoad: (load) =>
    set((s) => ({ loads: [...s.loads, load] })),

  updateLoad: (id, updated) =>
    set((s) => ({
      loads: s.loads.map((l) => (l.id === id ? updated : l)),
    })),

  deleteLoad: (id) =>
    set((s) => ({
      loads: s.loads.filter((l) => l.id !== id),
    })),
}));