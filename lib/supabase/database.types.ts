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
      accounts: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          is_cash: boolean
          kind: string
          name: string
          opening_balance: number
          owner_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          is_cash?: boolean
          kind: string
          name: string
          opening_balance?: number
          owner_id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          is_cash?: boolean
          kind?: string
          name?: string
          opening_balance?: number
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket: string
          content_type: string | null
          created_at: string
          filename: string
          id: string
          owner_id: string
          path: string
          record_id: string | null
          record_table: string | null
        }
        Insert: {
          bucket: string
          content_type?: string | null
          created_at?: string
          filename: string
          id?: string
          owner_id?: string
          path: string
          record_id?: string | null
          record_table?: string | null
        }
        Update: {
          bucket?: string
          content_type?: string | null
          created_at?: string
          filename?: string
          id?: string
          owner_id?: string
          path?: string
          record_id?: string | null
          record_table?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          id: string
          owner_id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          id?: string
          owner_id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          id?: string
          owner_id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          month: string
          owner_id: string
          planned_amount: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          month: string
          owner_id?: string
          planned_amount: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          month?: string
          owner_id?: string
          planned_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          owner_id: string
          paid_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          owner_id?: string
          paid_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          owner_id?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          balance: number
          created_at: string
          creditor: string
          due_day: number | null
          id: string
          interest_rate: number | null
          kind: string
          limit_amount: number | null
          minimum_payment: number | null
          owner_id: string
          status: string
        }
        Insert: {
          balance?: number
          created_at?: string
          creditor: string
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          kind?: string
          limit_amount?: number | null
          minimum_payment?: number | null
          owner_id?: string
          status?: string
        }
        Update: {
          balance?: number
          created_at?: string
          creditor?: string
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          kind?: string
          limit_amount?: number | null
          minimum_payment?: number | null
          owner_id?: string
          status?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          created_at: string
          ends_at: string | null
          google_event_id: string | null
          id: string
          location: string | null
          module: string | null
          owner_id: string
          record_id: string | null
          record_table: string | null
          source: string
          starts_at: string
          title: string
          transport_confirmed: boolean
          transport_needed: boolean
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          ends_at?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          module?: string | null
          owner_id?: string
          record_id?: string | null
          record_table?: string | null
          source?: string
          starts_at: string
          title: string
          transport_confirmed?: boolean
          transport_needed?: boolean
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          ends_at?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          module?: string | null
          owner_id?: string
          record_id?: string | null
          record_table?: string | null
          source?: string
          starts_at?: string
          title?: string
          transport_confirmed?: boolean
          transport_needed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          created_at: string
          day: number
          id: string
          lead_days: number[]
          month: number | null
          notes: string | null
          owner_id: string
          recurrence: string
          title: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          lead_days?: number[]
          month?: number | null
          notes?: string | null
          owner_id?: string
          recurrence?: string
          title: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          lead_days?: number[]
          month?: number | null
          notes?: string | null
          owner_id?: string
          recurrence?: string
          title?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          list_id: string
          name: string
          owner_id: string
          position: number
          quantity: string | null
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          list_id: string
          name: string
          owner_id?: string
          position?: number
          quantity?: string | null
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          list_id?: string
          name?: string
          owner_id?: string
          position?: number
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string
          created_at: string
          folder: string | null
          id: string
          owner_id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          folder?: string | null
          id?: string
          owner_id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          folder?: string | null
          id?: string
          owner_id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          privacy_blur: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          privacy_blur?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          privacy_blur?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quick_captures: {
        Row: {
          captured_at: string
          id: string
          owner_id: string
          payload: Json
          processed_at: string | null
          type: string
        }
        Insert: {
          captured_at?: string
          id?: string
          owner_id?: string
          payload: Json
          processed_at?: string | null
          type: string
        }
        Update: {
          captured_at?: string
          id?: string
          owner_id?: string
          payload?: Json
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          amount_at_risk: number | null
          created_at: string
          detail: string | null
          due_at: string | null
          id: string
          lead_time_days: number
          module: string
          owner_id: string
          record_id: string | null
          record_table: string | null
          severity: string
          snooze_reason: string | null
          status: string
          threshold_amount: number | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_at_risk?: number | null
          created_at?: string
          detail?: string | null
          due_at?: string | null
          id?: string
          lead_time_days?: number
          module: string
          owner_id?: string
          record_id?: string | null
          record_table?: string | null
          severity?: string
          snooze_reason?: string | null
          status?: string
          threshold_amount?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_at_risk?: number | null
          created_at?: string
          detail?: string | null
          due_at?: string | null
          id?: string
          lead_time_days?: number
          module?: string
          owner_id?: string
          record_id?: string | null
          record_table?: string | null
          severity?: string
          snooze_reason?: string | null
          status?: string
          threshold_amount?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          description: string
          entity_id: string | null
          id: string
          occurred_at: string
          owner_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          id?: string
          occurred_at?: string
          owner_id?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          id?: string
          occurred_at?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
