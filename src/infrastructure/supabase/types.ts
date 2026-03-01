export type Database = {
  public: {
    Tables: {
      campings: {
        Row: {
          id: string;
          name: string;
          slug: string;
          location: unknown;
          province: string;
          geohash: string;
          amenities: Record<string, boolean>;
          prices: Record<string, number> | null;
          contact: {
            phone?: string;
            whatsapp?: string;
            email?: string;
            website?: string;
          } | null;
          photos: string[];
          type: "municipal" | "nacional" | "privado" | "libre" | null;
          source: "sinta" | "scraped" | "community" | "osm";
          verified: boolean;
          owner_npub: string | null;
          owner_lightning_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          location: unknown;
          province: string;
          geohash: string;
          amenities?: Record<string, boolean>;
          prices?: Record<string, number> | null;
          contact?: {
            phone?: string;
            whatsapp?: string;
            email?: string;
            website?: string;
          } | null;
          photos?: string[];
          type?: "municipal" | "nacional" | "privado" | "libre" | null;
          source: "sinta" | "scraped" | "community" | "osm";
          verified?: boolean;
          owner_npub?: string | null;
          owner_lightning_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campings"]["Insert"]>;
      };
    };
    Functions: {
      get_campings_near: {
        Args: {
          lat: number;
          lng: number;
          radius_km: number;
          lim: number;
        };
        Returns: Array<
          Database["public"]["Tables"]["campings"]["Row"] & {
            distance_km: number;
          }
        >;
      };
      get_campings_in_bbox: {
        Args: {
          min_lat: number;
          min_lng: number;
          max_lat: number;
          max_lng: number;
        };
        Returns: Array<
          Omit<Database["public"]["Tables"]["campings"]["Row"], "location"> & {
            latitude: number;
            longitude: number;
          }
        >;
      };
      search_and_filter_campings: {
        Args: {
          query?: string;
          provinces?: string[];
          types?: string[];
          required_amenities?: string[];
          lim?: number;
          off_set?: number;
        };
        Returns: Array<
          Omit<Database["public"]["Tables"]["campings"]["Row"], "location"> & {
            latitude: number;
            longitude: number;
            similarity: number;
          }
        >;
      };
    };
  };
};
