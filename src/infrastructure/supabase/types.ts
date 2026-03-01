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
          source: "sinta" | "scraped" | "community";
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
          source: "sinta" | "scraped" | "community";
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
        Returns: Database["public"]["Tables"]["campings"]["Row"][];
      };
    };
  };
};
