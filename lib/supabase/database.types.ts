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
      appointments: {
        Row: {
          appointment_at: string
          completed: boolean
          cost: number | null
          created_at: string
          follow_up_date: string | null
          id: string
          notes: string | null
          owner_id: string
          provider: string
          purpose: string | null
        }
        Insert: {
          appointment_at: string
          completed?: boolean
          cost?: number | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          provider: string
          purpose?: string | null
        }
        Update: {
          appointment_at?: string
          completed?: boolean
          cost?: number | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          provider?: string
          purpose?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: string | null
          created_at: string
          entity_id: string | null
          id: string
          insured: boolean
          item: string
          location: string | null
          make: string | null
          model: string | null
          owner_id: string
          purchase_date: string | null
          purchase_price: number | null
          replacement_value: number | null
          retailer: string | null
          serial_number: string | null
          warranty_expiry: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          insured?: boolean
          item: string
          location?: string | null
          make?: string | null
          model?: string | null
          owner_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          replacement_value?: number | null
          retailer?: string | null
          serial_number?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          insured?: boolean
          item?: string
          location?: string | null
          make?: string | null
          model?: string | null
          owner_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          replacement_value?: number | null
          retailer?: string | null
          serial_number?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_entity_id_fkey"
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
      credentials: {
        Row: {
          created_at: string
          criticality: string
          id: string
          last_password_change: string | null
          owner_id: string
          recovery_email: string | null
          service: string
          two_fa_method: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          criticality?: string
          id?: string
          last_password_change?: string | null
          owner_id?: string
          recovery_email?: string | null
          service: string
          two_fa_method?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          criticality?: string
          id?: string
          last_password_change?: string | null
          owner_id?: string
          recovery_email?: string | null
          service?: string
          two_fa_method?: string | null
          username?: string | null
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
      documents: {
        Row: {
          created_at: string
          doc_type: string
          document_date: string | null
          entity_id: string | null
          expiry_date: string | null
          id: string
          issuer: string | null
          notes: string | null
          owner_id: string
          reference_number: string | null
          tax_year: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          document_date?: string | null
          entity_id?: string | null
          expiry_date?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          owner_id?: string
          reference_number?: string | null
          tax_year?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          document_date?: string | null
          entity_id?: string | null
          expiry_date?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          owner_id?: string
          reference_number?: string | null
          tax_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
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
      fuel_logs: {
        Row: {
          created_at: string
          full_tank: boolean
          id: string
          litres: number
          occurred_at: string
          odometer: number
          owner_id: string
          price_per_litre: number | null
          station: string | null
          total: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          full_tank?: boolean
          id?: string
          litres: number
          occurred_at?: string
          odometer: number
          owner_id?: string
          price_per_litre?: number | null
          station?: string | null
          total: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          full_tank?: boolean
          id?: string
          litres?: number
          occurred_at?: string
          odometer?: number
          owner_id?: string
          price_per_litre?: number | null
          station?: string | null
          total?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_accounts: {
        Row: {
          access_token: string
          created_at: string
          google_email: string | null
          id: string
          last_synced_at: string | null
          owner_id: string
          refresh_token: string
          scope: string
          token_expires_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          owner_id?: string
          refresh_token: string
          scope: string
          token_expires_at: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          owner_id?: string
          refresh_token?: string
          scope?: string
          token_expires_at?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string
          id: string
          metric: string
          owner_id: string
          recorded_at: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric?: string
          owner_id?: string
          recorded_at?: string
          unit?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          owner_id?: string
          recorded_at?: string
          unit?: string
          value?: number
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
      matters: {
        Row: {
          authority: string | null
          created_at: string
          due_date: string | null
          id: string
          last_contact: string | null
          matter: string
          next_action: string | null
          opened_date: string
          owner_id: string
          reference: string | null
          status: string
        }
        Insert: {
          authority?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          last_contact?: string | null
          matter: string
          next_action?: string | null
          opened_date?: string
          owner_id?: string
          reference?: string | null
          status?: string
        }
        Update: {
          authority?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          last_contact?: string | null
          matter?: string
          next_action?: string | null
          opened_date?: string
          owner_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: []
      }
      med_doses: {
        Row: {
          created_at: string
          dose_date: string
          id: string
          medicine_id: string
          owner_id: string
          skip_reason: string | null
          status: string
          time_slot: string
        }
        Insert: {
          created_at?: string
          dose_date?: string
          id?: string
          medicine_id: string
          owner_id?: string
          skip_reason?: string | null
          status: string
          time_slot: string
        }
        Update: {
          created_at?: string
          dose_date?: string
          id?: string
          medicine_id?: string
          owner_id?: string
          skip_reason?: string | null
          status?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_doses_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active: boolean
          created_at: string
          dose_text: string | null
          id: string
          monthly_collection_date: string | null
          name: string
          owner_id: string
          pharmacy: string | null
          repeats_left: number | null
          schedule: string[]
          script_expiry: string | null
          stock_on_hand: number
          strength: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          dose_text?: string | null
          id?: string
          monthly_collection_date?: string | null
          name: string
          owner_id?: string
          pharmacy?: string | null
          repeats_left?: number | null
          schedule?: string[]
          script_expiry?: string | null
          stock_on_hand?: number
          strength?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          dose_text?: string | null
          id?: string
          monthly_collection_date?: string | null
          name?: string
          owner_id?: string
          pharmacy?: string | null
          repeats_left?: number | null
          schedule?: string[]
          script_expiry?: string | null
          stock_on_hand?: number
          strength?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          archived: boolean
          body: string
          category: string
          created_at: string
          folder: string | null
          id: string
          owner_id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          body?: string
          category?: string
          created_at?: string
          folder?: string | null
          id?: string
          owner_id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          body?: string
          category?: string
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
      pet_care_items: {
        Row: {
          created_at: string
          id: string
          interval_days: number | null
          kind: string
          label: string
          last_done: string | null
          next_due: string | null
          owner_id: string
          pet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_days?: number | null
          kind: string
          label: string
          last_done?: string | null
          next_due?: string | null
          owner_id?: string
          pet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_days?: number | null
          kind?: string
          label?: string
          last_done?: string | null
          next_due?: string | null
          owner_id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_care_items_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_visits: {
        Row: {
          cost: number
          created_at: string
          diagnosis: string | null
          id: string
          occurred_at: string
          owner_id: string
          paid_by: string
          pet_id: string
          reason: string | null
          settled: boolean
          split_pct: number
          treatment: string | null
          weight_kg: number | null
        }
        Insert: {
          cost?: number
          created_at?: string
          diagnosis?: string | null
          id?: string
          occurred_at?: string
          owner_id?: string
          paid_by?: string
          pet_id: string
          reason?: string | null
          settled?: boolean
          split_pct?: number
          treatment?: string | null
          weight_kg?: number | null
        }
        Update: {
          cost?: number
          created_at?: string
          diagnosis?: string | null
          id?: string
          occurred_at?: string
          owner_id?: string
          paid_by?: string
          pet_id?: string
          reason?: string | null
          settled?: boolean
          split_pct?: number
          treatment?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_visits_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          breed: string | null
          co_owners: string | null
          created_at: string
          diet: string | null
          estimated_age: number | null
          id: string
          insurer: string | null
          microchip: string | null
          name: string
          owner_id: string
          species: string
          vet: string | null
        }
        Insert: {
          breed?: string | null
          co_owners?: string | null
          created_at?: string
          diet?: string | null
          estimated_age?: number | null
          id?: string
          insurer?: string | null
          microchip?: string | null
          name: string
          owner_id?: string
          species?: string
          vet?: string | null
        }
        Update: {
          breed?: string | null
          co_owners?: string | null
          created_at?: string
          diet?: string | null
          estimated_age?: number | null
          id?: string
          insurer?: string | null
          microchip?: string | null
          name?: string
          owner_id?: string
          species?: string
          vet?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          beneficiary: string | null
          broker_contact: string | null
          cover_amount: number | null
          created_at: string
          id: string
          insurer: string
          kind: string
          owner_id: string
          policy_number: string | null
          premium: number | null
          renewal_date: string | null
        }
        Insert: {
          beneficiary?: string | null
          broker_contact?: string | null
          cover_amount?: number | null
          created_at?: string
          id?: string
          insurer: string
          kind?: string
          owner_id?: string
          policy_number?: string | null
          premium?: number | null
          renewal_date?: string | null
        }
        Update: {
          beneficiary?: string | null
          broker_contact?: string | null
          cover_amount?: number | null
          created_at?: string
          id?: string
          insurer?: string
          kind?: string
          owner_id?: string
          policy_number?: string | null
          premium?: number | null
          renewal_date?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          privacy_blur: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          privacy_blur?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
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
      services: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          next_due_date: string | null
          next_due_odometer: number | null
          occurred_at: string
          odometer: number | null
          owner_id: string
          provider: string | null
          vehicle_id: string
          work_done: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          occurred_at?: string
          odometer?: number | null
          owner_id?: string
          provider?: string | null
          vehicle_id: string
          work_done?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          occurred_at?: string
          odometer?: number | null
          owner_id?: string
          provider?: string | null
          vehicle_id?: string
          work_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      trips: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          occurred_at: string
          odometer_end: number | null
          odometer_start: number | null
          owner_id: string
          purpose: string
          reimbursed: boolean
          to_location: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          occurred_at?: string
          odometer_end?: number | null
          odometer_start?: number | null
          owner_id?: string
          purpose?: string
          reimbursed?: boolean
          to_location?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          occurred_at?: string
          odometer_end?: number | null
          odometer_start?: number | null
          owner_id?: string
          purpose?: string
          reimbursed?: boolean
          to_location?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          financier: string | null
          fuel_type: string
          id: string
          insurer: string | null
          licence_disc_expiry: string | null
          main_driver: string | null
          make: string
          model: string
          odometer: number
          owner_id: string
          registered_owner: string | null
          registration: string | null
          warranty_end: string | null
          who_pays: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          financier?: string | null
          fuel_type?: string
          id?: string
          insurer?: string | null
          licence_disc_expiry?: string | null
          main_driver?: string | null
          make: string
          model: string
          odometer?: number
          owner_id?: string
          registered_owner?: string | null
          registration?: string | null
          warranty_end?: string | null
          who_pays?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          financier?: string | null
          fuel_type?: string
          id?: string
          insurer?: string | null
          licence_disc_expiry?: string | null
          main_driver?: string | null
          make?: string
          model?: string
          odometer?: number
          owner_id?: string
          registered_owner?: string | null
          registration?: string | null
          warranty_end?: string | null
          who_pays?: string | null
          year?: number | null
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
