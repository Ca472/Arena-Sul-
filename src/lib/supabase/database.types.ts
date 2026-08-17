export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventStatus = "draft" | "published";

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          description: string;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          status: EventStatus;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          description: string;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          status?: EventStatus;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      event_photos: {
        Row: {
          id: string;
          event_id: string;
          storage_path: string;
          original_name: string;
          alt_text: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          display_order: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          storage_path: string;
          original_name: string;
          alt_text?: string;
          mime_type: string;
          size_bytes: number;
          width?: number | null;
          height?: number | null;
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_photos"]["Insert"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          is_public: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          is_public?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_status: EventStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
