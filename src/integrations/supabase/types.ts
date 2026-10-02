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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_name: string | null
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      districts: {
        Row: {
          code: string
          created_at: string
          division_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          code?: string
          created_at?: string
          division_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          code?: string
          created_at?: string
          division_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          uploaded_by?: string
          url?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string
          caption: string | null
          category_id: string | null
          content: string
          created_at: string
          district_id: string | null
          division_id: string | null
          featured_image: string | null
          id: string
          images: Json
          is_breaking: boolean
          is_top: boolean
          location: string | null
          published_at: string | null
          published_by: string | null
          reporter_designation: string | null
          reporter_name: string | null
          review_note: string | null
          slug: string
          source: string | null
          status: Database["public"]["Enums"]["news_status"]
          submitted_at: string | null
          summary: string | null
          title: string
          upazila_id: string | null
          updated_at: string
          video_url: string | null
          views: number
        }
        Insert: {
          author_id: string
          caption?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          featured_image?: string | null
          id?: string
          images?: Json
          is_breaking?: boolean
          is_top?: boolean
          location?: string | null
          published_at?: string | null
          published_by?: string | null
          reporter_designation?: string | null
          reporter_name?: string | null
          review_note?: string | null
          slug: string
          source?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          submitted_at?: string | null
          summary?: string | null
          title: string
          upazila_id?: string | null
          updated_at?: string
          video_url?: string | null
          views?: number
        }
        Update: {
          author_id?: string
          caption?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          district_id?: string | null
          division_id?: string | null
          featured_image?: string | null
          id?: string
          images?: Json
          is_breaking?: boolean
          is_top?: boolean
          location?: string | null
          published_at?: string | null
          published_by?: string | null
          reporter_designation?: string | null
          reporter_name?: string | null
          review_note?: string | null
          slug?: string
          source?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          submitted_at?: string | null
          summary?: string | null
          title?: string
          upazila_id?: string | null
          updated_at?: string
          video_url?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      news_comments: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          is_approved: boolean
          news_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          is_approved?: boolean
          news_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          news_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_reports: {
        Row: {
          contact: string | null
          created_at: string
          details: string | null
          id: string
          is_resolved: boolean
          news_id: string
          reason: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          details?: string | null
          id?: string
          is_resolved?: boolean
          news_id: string
          reason: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          details?: string | null
          id?: string
          is_resolved?: boolean
          news_id?: string
          reason?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_reports_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          for_admins: boolean
          id: string
          is_read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          for_admins?: boolean
          id?: string
          is_read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          for_admins?: boolean
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_publish: boolean
          created_at: string
          designation: string | null
          district_id: string | null
          email: string | null
          full_name: string
          id: string
          joining_date: string
          mobile: string | null
          photo_url: string | null
          representative_id: string | null
          status: Database["public"]["Enums"]["account_status"]
          upazila_id: string | null
          updated_at: string
        }
        Insert: {
          can_publish?: boolean
          created_at?: string
          designation?: string | null
          district_id?: string | null
          email?: string | null
          full_name?: string
          id: string
          joining_date?: string
          mobile?: string | null
          photo_url?: string | null
          representative_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          upazila_id?: string | null
          updated_at?: string
        }
        Update: {
          can_publish?: boolean
          created_at?: string
          designation?: string | null
          district_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          joining_date?: string
          mobile?: string | null
          photo_url?: string | null
          representative_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          upazila_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      upazilas: {
        Row: {
          created_at: string
          district_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_settings: {
        Row: {
          about_text: string
          contact_email: string | null
          contact_number: string
          editor_name: string
          executive_editor_name: string
          facebook_url: string | null
          favicon_url: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          news_editor_name: string
          office_address: string
          publisher_name: string
          site_name: string
          tagline: string
          twitter_url: string | null
          updated_at: string
          watermark_enabled: boolean
          watermark_opacity: number
          watermark_position: string
          website_url: string
          youtube_url: string | null
        }
        Insert: {
          about_text?: string
          contact_email?: string | null
          contact_number?: string
          editor_name?: string
          executive_editor_name?: string
          facebook_url?: string | null
          favicon_url?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          news_editor_name?: string
          office_address?: string
          publisher_name?: string
          site_name?: string
          tagline?: string
          twitter_url?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          watermark_opacity?: number
          watermark_position?: string
          website_url?: string
          youtube_url?: string | null
        }
        Update: {
          about_text?: string
          contact_email?: string | null
          contact_number?: string
          editor_name?: string
          executive_editor_name?: string
          facebook_url?: string | null
          favicon_url?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          news_editor_name?: string
          office_address?: string
          publisher_name?: string
          site_name?: string
          tagline?: string
          twitter_url?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          watermark_opacity?: number
          watermark_position?: string
          website_url?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_publish: { Args: { _user_id: string }; Returns: boolean }
      has_permission: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_news_views: { Args: { _slug: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      next_representative_id: {
        Args: { _district_id: string }
        Returns: string
      }
    }
    Enums: {
      account_status: "PENDING" | "ACTIVE" | "SUSPENDED"
      app_role: "SUPER_ADMIN" | "ADMIN" | "REPRESENTATIVE" | "VISITOR"
      news_status:
        | "DRAFT"
        | "PENDING"
        | "CORRECTION_REQUIRED"
        | "APPROVED"
        | "PUBLISHED"
        | "REJECTED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["PENDING", "ACTIVE", "SUSPENDED"],
      app_role: ["SUPER_ADMIN", "ADMIN", "REPRESENTATIVE", "VISITOR"],
      news_status: [
        "DRAFT",
        "PENDING",
        "CORRECTION_REQUIRED",
        "APPROVED",
        "PUBLISHED",
        "REJECTED",
      ],
    },
  },
} as const
