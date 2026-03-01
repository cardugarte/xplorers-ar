export interface Review {
  id: string;
  event_id: string;
  camping_id: string;
  author_npub: string;
  rating: number;
  content: string;
  photos: string[];
  verified_visit: boolean;
  created_at: number;
}

export interface CheckIn {
  id: string;
  event_id: string;
  camping_id: string;
  author_npub: string;
  geohash: string;
  created_at: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  criteria: string;
  d_tag: string;
}

export const BADGES = {
  EXPLORADOR_I: {
    name: "Explorador I",
    description: "Visitaste 5 campings",
    criteria: "5_campings_visited",
    d_tag: "explorador-i",
  },
  EXPLORADOR_II: {
    name: "Explorador II",
    description: "Visitaste 20 campings",
    criteria: "20_campings_visited",
    d_tag: "explorador-ii",
  },
  PATAGONICO: {
    name: "Patagónico",
    description: "Completaste la ruta patagónica",
    criteria: "patagonia_route_complete",
    d_tag: "patagonico",
  },
  CRITICO_DEL_FOGON: {
    name: "Crítico del Fogón",
    description: "Dejaste 10 reviews",
    criteria: "10_reviews",
    d_tag: "critico-del-fogon",
  },
  PIONERO: {
    name: "Pionero",
    description: "Uno de los primeros 500 usuarios",
    criteria: "first_500_users",
    d_tag: "pionero",
  },
} as const;
