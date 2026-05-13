export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      community_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          body: string
          category: string | null
          city: string | null
          created_at: string
          display_name: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          category?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          color: string
          created_at: string
          id: string
          image_url: string | null
          text: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      native_plants_cache: {
        Row: {
          category: string
          common_name: string | null
          common_name_en: string | null
          description: string | null
          description_en: string | null
          fetched_at: string
          id: string
          image_url: string | null
          inat_url: string | null
          observation_count: number
          region_key: string
          scientific_name: string
          taxon_id: number
          wikipedia_url: string | null
        }
        Insert: {
          category?: string
          common_name?: string | null
          common_name_en?: string | null
          description?: string | null
          description_en?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          inat_url?: string | null
          observation_count?: number
          region_key: string
          scientific_name: string
          taxon_id: number
          wikipedia_url?: string | null
        }
        Update: {
          category?: string
          common_name?: string | null
          common_name_en?: string | null
          description?: string | null
          description_en?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          inat_url?: string | null
          observation_count?: number
          region_key?: string
          scientific_name?: string
          taxon_id?: number
          wikipedia_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_rainfall: number | null
          city: string | null
          climate_zone: string | null
          country: string | null
          created_at: string
          display_name: string | null
          has_valley_effect: boolean | null
          id: string
          language: string
          latitude: number | null
          longitude: number | null
          max_temp: number | null
          min_temp: number | null
          onboarding_completed: boolean | null
          pronoun: string | null
          updated_at: string
          user_id: string
          wind_exposure: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rainfall?: number | null
          city?: string | null
          climate_zone?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          has_valley_effect?: boolean | null
          id?: string
          language?: string
          latitude?: number | null
          longitude?: number | null
          max_temp?: number | null
          min_temp?: number | null
          onboarding_completed?: boolean | null
          pronoun?: string | null
          updated_at?: string
          user_id: string
          wind_exposure?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rainfall?: number | null
          city?: string | null
          climate_zone?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          has_valley_effect?: boolean | null
          id?: string
          language?: string
          latitude?: number | null
          longitude?: number | null
          max_temp?: number | null
          min_temp?: number | null
          onboarding_completed?: boolean | null
          pronoun?: string | null
          updated_at?: string
          user_id?: string
          wind_exposure?: string | null
        }
        Relationships: []
      }
      user_plants: {
        Row: {
          added_at: string
          id: string
          plant_category: string
          plant_name: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          plant_category: string
          plant_name: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          plant_category?: string
          plant_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
