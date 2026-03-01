import { create } from "zustand";

import type { AmenityKey, CampingType, Province, SortOption } from "./types";

interface FilterState {
  searchQuery: string;
  provinces: Province[];
  types: CampingType[];
  requiredAmenities: AmenityKey[];
  sortBy: SortOption;
  userCoords: { lat: number; lng: number } | null;
}

interface FilterActions {
  setSearchQuery: (query: string) => void;
  toggleProvince: (province: Province) => void;
  toggleType: (type: CampingType) => void;
  toggleAmenity: (amenity: AmenityKey) => void;
  setSortBy: (sortBy: SortOption) => void;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  clearFilters: () => void;
}

const initialState: FilterState = {
  searchQuery: "",
  provinces: [],
  types: [],
  requiredAmenities: [],
  sortBy: "name",
  userCoords: null,
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
  setSortBy: (sortBy) => set({ sortBy }),
  setUserCoords: (userCoords) => set({ userCoords }),
  clearFilters: () => set(initialState),
}));
