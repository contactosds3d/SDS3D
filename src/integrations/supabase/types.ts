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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          description: string
          id: string
          image: string
          name: string
          parent_id: string | null
          position: number
          visible: boolean
        }
        Insert: {
          description?: string
          id?: string
          image?: string
          name: string
          parent_id?: string | null
          position?: number
          visible?: boolean
        }
        Update: {
          description?: string
          id?: string
          image?: string
          name?: string
          parent_id?: string | null
          position?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_limits: {
        Row: {
          key: string
          last_at: string
        }
        Insert: {
          key: string
          last_at?: string
        }
        Update: {
          key?: string
          last_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          attachments: Json
          consent: boolean
          created_at: string
          email: string
          id: string
          message: string
          name: string
          notes: string
          phone: string
          reference: string
          service: string
          status: string
        }
        Insert: {
          attachments?: Json
          consent: boolean
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          notes?: string
          phone?: string
          reference?: string
          service?: string
          status?: string
        }
        Update: {
          attachments?: Json
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string
          phone?: string
          reference?: string
          service?: string
          status?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          alt: string
          created_at: string
          folder: string
          id: string
          name: string
          path: string
        }
        Insert: {
          alt?: string
          created_at?: string
          folder?: string
          id?: string
          name: string
          path: string
        }
        Update: {
          alt?: string
          created_at?: string
          folder?: string
          id?: string
          name?: string
          path?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          description: string
          details: string
          example: boolean
          id: string
          image: string
          name: string
          position: number
          published: boolean
        }
        Insert: {
          description?: string
          details?: string
          example?: boolean
          id?: string
          image?: string
          name: string
          position?: number
          published?: boolean
        }
        Update: {
          description?: string
          details?: string
          example?: boolean
          id?: string
          image?: string
          name?: string
          position?: number
          published?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          content: Json
          id: string
        }
        Insert: {
          content?: Json
          id?: string
        }
        Update: {
          content?: Json
          id?: string
        }
        Relationships: []
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
      works: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          example: boolean
          featured: boolean
          id: string
          images: Json
          material: string
          name: string
          position: number
          price: number | null
          published: boolean
          seo_description: string
          seo_title: string
          slug: string
          specifications: string
          stock: number | null
          video: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          example?: boolean
          featured?: boolean
          id?: string
          images?: Json
          material?: string
          name: string
          position?: number
          price?: number | null
          published?: boolean
          seo_description?: string
          seo_title?: string
          slug: string
          specifications?: string
          stock?: number | null
          video?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          example?: boolean
          featured?: boolean
          id?: string
          images?: Json
          material?: string
          name?: string
          position?: number
          price?: number | null
          published?: boolean
          seo_description?: string
          seo_title?: string
          slug?: string
          specifications?: string
          stock?: number | null
          video?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_contact_slot: { Args: { address: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
