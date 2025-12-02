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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_packages: {
        Row: {
          ad_type: string
          created_at: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          ad_type: string
          created_at?: string
          duration_days: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price?: number
        }
        Update: {
          ad_type?: string
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          item_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          item_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          item_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          link_url: string | null
          section: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          link_url?: string | null
          section: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          link_url?: string | null
          section?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      image_slidebar: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          ad_duration_days: number | null
          ad_type: string | null
          auto_repost: boolean | null
          boost_count: number | null
          category_id: string | null
          condition: string | null
          created_at: string
          description: string
          expires_at: string | null
          featured_until: string | null
          id: string
          images: string[] | null
          is_negotiable: boolean | null
          is_promoted: boolean | null
          is_sold: boolean | null
          location: string | null
          price: number
          promotion_expires_at: string | null
          seller_id: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          ad_duration_days?: number | null
          ad_type?: string | null
          auto_repost?: boolean | null
          boost_count?: number | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          is_promoted?: boolean | null
          is_sold?: boolean | null
          location?: string | null
          price: number
          promotion_expires_at?: string | null
          seller_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          ad_duration_days?: number | null
          ad_type?: string | null
          auto_repost?: boolean | null
          boost_count?: number | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          is_promoted?: boolean | null
          is_sold?: boolean | null
          location?: string | null
          price?: number
          promotion_expires_at?: string | null
          seller_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_confirmed: boolean | null
          buyer_confirmed_at: string | null
          buyer_id: string
          created_at: string
          dispute_raised_by: string | null
          dispute_reason: string | null
          dispute_status: string | null
          id: string
          item_id: string
          meetup_location: string | null
          meetup_time: string | null
          seller_confirmed: boolean | null
          seller_confirmed_at: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_confirmed?: boolean | null
          buyer_confirmed_at?: string | null
          buyer_id: string
          created_at?: string
          dispute_raised_by?: string | null
          dispute_reason?: string | null
          dispute_status?: string | null
          id?: string
          item_id: string
          meetup_location?: string | null
          meetup_time?: string | null
          seller_confirmed?: boolean | null
          seller_confirmed_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_confirmed?: boolean | null
          buyer_confirmed_at?: string | null
          buyer_id?: string
          created_at?: string
          dispute_raised_by?: string | null
          dispute_reason?: string | null
          dispute_status?: string | null
          id?: string
          item_id?: string
          meetup_location?: string | null
          meetup_time?: string | null
          seller_confirmed?: boolean | null
          seller_confirmed_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          batch: string | null
          campus_points: number | null
          college_name: string | null
          course: string | null
          created_at: string
          deals_completed: number | null
          email: string | null
          full_name: string | null
          hostel: string | null
          id: string
          is_verified: boolean | null
          mck_id: string | null
          phone: string | null
          student_id: string | null
          total_ratings: number | null
          trust_seller_badge: boolean | null
          university: string | null
          updated_at: string
          user_id: string
          verification_document_url: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          batch?: string | null
          campus_points?: number | null
          college_name?: string | null
          course?: string | null
          created_at?: string
          deals_completed?: number | null
          email?: string | null
          full_name?: string | null
          hostel?: string | null
          id?: string
          is_verified?: boolean | null
          mck_id?: string | null
          phone?: string | null
          student_id?: string | null
          total_ratings?: number | null
          trust_seller_badge?: boolean | null
          university?: string | null
          updated_at?: string
          user_id: string
          verification_document_url?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          batch?: string | null
          campus_points?: number | null
          college_name?: string | null
          course?: string | null
          created_at?: string
          deals_completed?: number | null
          email?: string | null
          full_name?: string | null
          hostel?: string | null
          id?: string
          is_verified?: boolean | null
          mck_id?: string | null
          phone?: string | null
          student_id?: string | null
          total_ratings?: number | null
          trust_seller_badge?: boolean | null
          university?: string | null
          updated_at?: string
          user_id?: string
          verification_document_url?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          order_id: string
          rating: number
          review: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          order_id: string
          rating: number
          review?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          order_id?: string
          rating?: number
          review?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string
          report_type: string
          reported_by: string
          reporter_email: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason: string
          report_type: string
          reported_by: string
          reporter_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string
          report_type?: string
          reported_by?: string
          reporter_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      terms_and_conditions: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          item_id: string
          points_awarded: number | null
          seller_id: string
          status: string | null
          transaction_type: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          item_id: string
          points_awarded?: number | null
          seller_id: string
          status?: string | null
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          item_id?: string
          points_awarded?: number | null
          seller_id?: string
          status?: string | null
          transaction_type?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          ip_address: string | null
          terms_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_terms_acceptance_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "terms_and_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_order: { Args: { order_id: string }; Returns: Json }
      complete_order_with_confirmation: {
        Args: {
          confirming_user_id: string
          order_id: string
          user_type: string
        }
        Returns: Json
      }
      generate_mck_id: { Args: never; Returns: string }
      get_admin_role: { Args: { user_id: string }; Returns: string }
      get_monthly_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          campus_points: number
          deals_completed: number
          full_name: string
          mck_id: string
          monthly_revenue: number
          monthly_sales: number
          trust_seller_badge: boolean
          university: string
          user_id: string
        }[]
      }
      get_unread_count: {
        Args: { conv_id: string; uid: string }
        Returns: number
      }
      handle_ad_expiry: { Args: never; Returns: undefined }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      mark_messages_read: {
        Args: { conv_id: string; uid: string }
        Returns: undefined
      }
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
