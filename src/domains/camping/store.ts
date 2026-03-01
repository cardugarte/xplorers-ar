import { create } from "zustand";

import type { AmenityKey, CampingType, Province } from "./types";

interface FilterState {
  searchQuery: string;
  provinces: Province[];
  types: CampingType[];
  requiredAmenities: AmenityKey[];
}

interface FilterActions {
  setSearchQuery: (query: string) => void;
  toggleProvince: (province: Province) => void;
  toggleType: (type: CampingType) => void;
  toggleAmenity: (amenity: AmenityKey) => void;
  clearFilters: () => void;
}

const initialState: FilterState = {
  searchQuery: "",
  provinces: [],
  types: [],
  requiredAmenities: [],
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...initialState,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleProvince: (province) =>
    set((s) => ({ provinces: toggle(s.provinces, province) })),
  toggleType: (type) => set((s) => ({ types: toggle(s.types, type) })),
  toggleAmenity: (amenity) =>
    set((s) => ({ requiredAmenities: toggle(s.requiredAmenities, amenity) })),
  clearFilters: () => set(initialState),
}));
