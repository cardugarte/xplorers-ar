export type Database = {
  public: {
    Tables: {
      reservations: {
        Row: {
          id: string;
          camping_id: string;
          user_id: string;
          camper_npub: string | null;
          check_in: string;
          check_out: string;
          guests: number;
          notes: string | null;
          total_sats: number | null;
          status:
            | "pending"
            | "payment_requested"
            | "paid"
            | "confirmed"
            | "cancelled"
            | "expired";
          payment_hash: string | null;
          preimage: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          camping_id: string;
          user_id: string;
          camper_npub?: string | null;
          check_in: string;
          check_out: string;
          guests?: number;
          notes?: string | null;
          total_sats?: number | null;
          status?: "pending" | "payment_requested" | "paid" | "confirmed" | "cancelled" | "expired";
          payment_hash?: string | null;
          preimage?: string | null;
        };
        Update: {
          id?: string;
          camping_id?: string;
          user_id?: string;
          camper_npub?: string | null;
          check_in?: string;
          check_out?: string;
          guests?: number;
          notes?: string | null;
          total_sats?: number | null;
          status?: "pending" | "payment_requested" | "paid" | "confirmed" | "cancelled" | "expired";
          payment_hash?: string | null;
          preimage?: string | null;
        };
        Relationships: [];
      };
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
          claimed: boolean;
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
          claimed?: boolean;
          owner_npub?: string | null;
          owner_lightning_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campings"]["Insert"]>;
        Relationships: [];
      };
      owner_claims: {
        Row: {
          id: string;
          camping_id: string;
          claimer_id: string;
          status: "pending" | "approved" | "rejected";
          evidence: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          camping_id: string;
          claimer_id: string;
          status?: "pending" | "approved" | "rejected";
          evidence?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["owner_claims"]["Insert"]>;
      };
      curated_routes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          region: string | null;
          difficulty: "easy" | "moderate" | "hard" | null;
          duration_days: number | null;
          camping_ids: string[];
          waypoints: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          region?: string | null;
          difficulty?: "easy" | "moderate" | "hard" | null;
          duration_days?: number | null;
          camping_ids?: string[];
          waypoints?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["curated_routes"]["Insert"]>;
      };
      error_reports: {
        Row: {
          id: string;
          camping_id: string;
          reporter_id: string | null;
          description: string;
          type:
            | "wrong_location"
            | "closed"
            | "wrong_info"
            | "duplicate"
            | "other";
          status: "pending" | "reviewed" | "fixed" | "dismissed";
          created_at: string;
        };
        Insert: {
          camping_id: string;
          description: string;
          type:
            | "wrong_location"
            | "closed"
            | "wrong_info"
            | "duplicate"
            | "other";
        };
        Update: Partial<
          Database["public"]["Tables"]["error_reports"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
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
          sort_by?: string;
          user_lat?: number;
          user_lng?: number;
          lim?: number;
          off_set?: number;
        };
        Returns: Array<
          Omit<Database["public"]["Tables"]["campings"]["Row"], "location"> & {
            latitude: number;
            longitude: number;
            similarity: number;
            distance_km: number | null;
          }
        >;
      };
      get_route_with_campings: {
        Args: { route_id: string };
        Returns: {
          route: Database["public"]["Tables"]["curated_routes"]["Row"];
          campings: Array<
            Omit<Database["public"]["Tables"]["campings"]["Row"], "location"> & {
              latitude: number;
              longitude: number;
            }
          >;
        };
      };
      set_owner_lightning_address: {
        Args: {
          camping_id: string;
          lud16: string;
        };
        Returns: void;
      };
    };
  };
};
