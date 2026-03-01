import { z } from "zod";

export const CampingSourceSchema = z.enum(["sinta", "scraped", "community", "osm"]);
export type CampingSource = z.infer<typeof CampingSourceSchema>;

export const CampingTypeSchema = z.enum(["municipal", "nacional", "privado", "libre"]);
export type CampingType = z.infer<typeof CampingTypeSchema>;

export const SortOptionSchema = z.enum(["name", "distance"]);
export type SortOption = z.infer<typeof SortOptionSchema>;

export const AmenitiesSchema = z.object({
  water: z.boolean().optional(),
  electricity: z.boolean().optional(),
  bathrooms: z.boolean().optional(),
  showers: z.boolean().optional(),
  hot_water: z.boolean().optional(),
  wifi: z.boolean().optional(),
  store: z.boolean().optional(),
  grill: z.boolean().optional(),
  pool: z.boolean().optional(),
  pets_allowed: z.boolean().optional(),
  parking: z.boolean().optional(),
  restaurant: z.boolean().optional(),
});
export type Amenities = z.infer<typeof AmenitiesSchema>;

export const PricesSchema = z.object({
  tent_per_night: z.number().optional(),
  car_per_night: z.number().optional(),
  person_per_night: z.number().optional(),
  motorhome_per_night: z.number().optional(),
  currency: z.enum(["ARS", "USD", "SAT"]).default("ARS"),
  updated_at: z.string().optional(),
});
export type Prices = z.infer<typeof PricesSchema>;

export const ContactSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const CampingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  province: z.string().min(1),
  geohash: z.string().min(1),
  type: CampingTypeSchema.optional(),
  amenities: AmenitiesSchema,
  prices: PricesSchema.nullable(),
  contact: ContactSchema.nullable(),
  photos: z.array(z.string().url()),
  source: CampingSourceSchema,
  verified: z.boolean(),
  owner_npub: z.string().nullable(),
  owner_lightning_address: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Camping = z.infer<typeof CampingSchema>;

export const PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type Province = (typeof PROVINCES)[number];

export type AmenityKey = keyof Amenities;

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  water: "Agua",
  electricity: "Electricidad",
  bathrooms: "Baños",
  showers: "Duchas",
  hot_water: "Agua caliente",
  wifi: "WiFi",
  store: "Proveeduría",
  grill: "Parrillas",
  pool: "Pileta",
  pets_allowed: "Mascotas",
  parking: "Estacionamiento",
  restaurant: "Restaurante",
};

export const CAMPING_TYPE_LABELS: Record<CampingType, string> = {
  municipal: "Municipal",
  nacional: "Nacional",
  privado: "Privado",
  libre: "Libre",
};

export const ERROR_REPORT_TYPES = [
  { value: "wrong_location", label: "Ubicación incorrecta" },
  { value: "closed", label: "Cerrado permanentemente" },
  { value: "wrong_info", label: "Información incorrecta" },
  { value: "duplicate", label: "Duplicado" },
  { value: "other", label: "Otro" },
] as const;

export type ErrorReportType = (typeof ERROR_REPORT_TYPES)[number]["value"];
