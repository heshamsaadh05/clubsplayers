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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      club_usage: {
        Row: {
          club_user_id: string
          created_at: string
          favorites_count: number
          id: string
          messages_sent: number
          month_year: string
          player_views: number
          updated_at: string
        }
        Insert: {
          club_user_id: string
          created_at?: string
          favorites_count?: number
          id?: string
          messages_sent?: number
          month_year: string
          player_views?: number
          updated_at?: string
        }
        Update: {
          club_user_id?: string
          created_at?: string
          favorites_count?: number
          id?: string
          messages_sent?: number
          month_year?: string
          player_views?: number
          updated_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          club_user_id: string
          created_at: string
          id: string
          player_id: string
        }
        Insert: {
          club_user_id: string
          created_at?: string
          id?: string
          player_id: string
        }
        Update: {
          club_user_id?: string
          created_at?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string | null
          content_ar: string | null
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          slug: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          slug: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          instructions: string | null
          instructions_ar: string | null
          is_active: boolean
          name: string
          name_ar: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean
          name: string
          name_ar: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean
          name?: string
          name_ar?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          club_user_id: string
          comment: string | null
          created_at: string
          id: string
          player_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          club_user_id: string
          comment?: string | null
          created_at?: string
          id?: string
          player_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          club_user_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          player_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_views: {
        Row: {
          club_user_id: string
          id: string
          player_id: string
          viewed_at: string
        }
        Insert: {
          club_user_id: string
          id?: string
          player_id: string
          viewed_at?: string
        }
        Update: {
          club_user_id?: string
          id?: string
          player_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_views_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          bio: string | null
          created_at: string
          current_club: string | null
          date_of_birth: string | null
          email: string
          full_name: string
          height_cm: number | null
          id: string
          id_document_url: string | null
          nationality: string | null
          phone: string | null
          position: string | null
          previous_clubs: string[] | null
          profile_image_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["player_status"]
          updated_at: string
          user_id: string
          video_urls: string[] | null
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          current_club?: string | null
          date_of_birth?: string | null
          email: string
          full_name: string
          height_cm?: number | null
          id?: string
          id_document_url?: string | null
          nationality?: string | null
          phone?: string | null
          position?: string | null
          previous_clubs?: string[] | null
          profile_image_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
          user_id: string
          video_urls?: string[] | null
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          current_club?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string
          height_cm?: number | null
          id?: string
          id_document_url?: string | null
          nationality?: string | null
          phone?: string | null
          position?: string | null
          previous_clubs?: string[] | null
          profile_image_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
          user_id?: string
          video_urls?: string[] | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      renewal_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          new_end_date: string
          old_end_date: string
          status: string
          subscription_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          new_end_date: string
          old_end_date: string
          status?: string
          subscription_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          new_end_date?: string
          old_end_date?: string
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          plan_type: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          plan_type?: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          plan_type?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          plan_id: string
          renewal_reminder_sent: boolean
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id: string
          renewal_reminder_sent?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string
          renewal_reminder_sent?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "player" | "club"
      player_status: "pending" | "approved" | "rejected"
      subscription_status: "active" | "expired" | "cancelled"
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
    Enums: {
      app_role: ["admin", "player", "club"],
      player_status: ["pending", "approved", "rejected"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
