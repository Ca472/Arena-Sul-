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
      site_media: {
        Row: {
          slot: string;
          storage_path: string;
          original_name: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          size_bytes: number;
          width: number | null;
          height: number | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          slot: string;
          storage_path: string;
          original_name: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          size_bytes: number;
          width?: number | null;
          height?: number | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_media"]["Insert"]>;
        Relationships: [];
      };
      instagram_oauth_invites: {
        Row: {
          id: string;
          token_hash: string;
          expires_at: string;
          consumed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_hash: string;
          expires_at: string;
          consumed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["instagram_oauth_invites"]["Insert"]
        >;
        Relationships: [];
      };
      instagram_oauth_states: {
        Row: {
          id: string;
          invite_id: string;
          state_hash: string;
          expires_at: string;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invite_id: string;
          state_hash: string;
          expires_at: string;
          consumed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["instagram_oauth_states"]["Insert"]
        >;
        Relationships: [];
      };
      instagram_connections: {
        Row: {
          id: string;
          instagram_user_id: string;
          username: string;
          token_ciphertext: string;
          token_iv: string;
          token_auth_tag: string;
          token_key_version: number;
          scopes: string[];
          expires_at: string;
          connected_at: string;
          last_refreshed_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instagram_user_id: string;
          username: string;
          token_ciphertext: string;
          token_iv: string;
          token_auth_tag: string;
          token_key_version?: number;
          scopes?: string[];
          expires_at: string;
          connected_at?: string;
          last_refreshed_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["instagram_connections"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_instagram_oauth_invite: {
        Args: {
          p_token_hash: string;
          p_expires_at: string;
          p_created_by: string;
        };
        Returns: string;
      };
      consume_instagram_oauth_invite: {
        Args: {
          p_invite_hash: string;
          p_state_hash: string;
          p_state_expires_at: string;
        };
        Returns: string;
      };
    };
    Enums: {
      event_status: EventStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
