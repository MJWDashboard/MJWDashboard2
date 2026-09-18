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
      action_items: {
        Row: {
          archived_at: string | null
          building_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          escalation_flag: boolean
          id: string
          meeting_id: string | null
          organization_id: string | null
          owner: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          risk: boolean
          status: Database["public"]["Enums"]["record_status"]
          tenant_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          escalation_flag?: boolean
          id?: string
          meeting_id?: string | null
          organization_id?: string | null
          owner?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          risk?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          escalation_flag?: boolean
          id?: string
          meeting_id?: string | null
          organization_id?: string | null
          owner?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          risk?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arrears_comments: {
        Row: {
          archived_at: string | null
          arrears_current_id: string | null
          attachment_document_id: string | null
          building_id: string
          comment: string
          created_at: string
          created_by: string | null
          escalation: boolean
          follow_up_date: string | null
          id: string
          meeting_id: string | null
          promise_to_pay_amount: number | null
          promise_to_pay_date: string | null
          status: Database["public"]["Enums"]["record_status"]
          tenant_id: string | null
        }
        Insert: {
          archived_at?: string | null
          arrears_current_id?: string | null
          attachment_document_id?: string | null
          building_id: string
          comment: string
          created_at?: string
          created_by?: string | null
          escalation?: boolean
          follow_up_date?: string | null
          id?: string
          meeting_id?: string | null
          promise_to_pay_amount?: number | null
          promise_to_pay_date?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
        }
        Update: {
          archived_at?: string | null
          arrears_current_id?: string | null
          attachment_document_id?: string | null
          building_id?: string
          comment?: string
          created_at?: string
          created_by?: string | null
          escalation?: boolean
          follow_up_date?: string | null
          id?: string
          meeting_id?: string | null
          promise_to_pay_amount?: number | null
          promise_to_pay_date?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arrears_comments_arrears_current_id_fkey"
            columns: ["arrears_current_id"]
            isOneToOne: false
            referencedRelation: "arrears_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrears_comments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrears_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arrears_current: {
        Row: {
          account_number: string | null
          as_of_month: string | null
          assigned_to: string | null
          building_id: string
          current_balance: number
          days_30: number | null
          days_60: number | null
          days_90_plus: number | null
          debtor_name: string | null
          id: string
          last_imported_at: string | null
          last_imported_source: string | null
          match_status: string
          risk: boolean
          status: Database["public"]["Enums"]["record_status"]
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          as_of_month?: string | null
          assigned_to?: string | null
          building_id: string
          current_balance?: number
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          debtor_name?: string | null
          id?: string
          last_imported_at?: string | null
          last_imported_source?: string | null
          match_status?: string
          risk?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          as_of_month?: string | null
          assigned_to?: string | null
          building_id?: string
          current_balance?: number
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          debtor_name?: string | null
          id?: string
          last_imported_at?: string | null
          last_imported_source?: string | null
          match_status?: string
          risk?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arrears_current_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrears_current_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arrears_history: {
        Row: {
          account_number: string | null
          as_of_month: string
          balance: number
          building_id: string
          days_30: number | null
          days_60: number | null
          days_90_plus: number | null
          debtor_name: string | null
          id: string
          import_source: string | null
          imported_at: string
          tenant_id: string | null
        }
        Insert: {
          account_number?: string | null
          as_of_month: string
          balance: number
          building_id: string
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          debtor_name?: string | null
          id?: string
          import_source?: string | null
          imported_at?: string
          tenant_id?: string | null
        }
        Update: {
          account_number?: string | null
          as_of_month?: string
          balance?: number
          building_id?: string
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          debtor_name?: string | null
          id?: string
          import_source?: string | null
          imported_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arrears_history_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrears_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          field_changes: Json | null
          id: string
          import_source: string | null
          performed_at: string
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          field_changes?: Json | null
          id?: string
          import_source?: string | null
          performed_at?: string
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          field_changes?: Json | null
          id?: string
          import_source?: string | null
          performed_at?: string
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      building_assignments: {
        Row: {
          assigned_by: string | null
          building_id: string
          created_at: string
          id: string
          portfolio_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          building_id: string
          created_at?: string
          id?: string
          portfolio_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          building_id?: string
          created_at?: string
          id?: string
          portfolio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_assignments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          archived_at: string | null
          budget: number | null
          created_at: string
          created_by: string | null
          gla: number | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          portfolio_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          gla?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          portfolio_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          gla?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          portfolio_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          active: boolean
          after_hours_number: string | null
          archived_at: string | null
          building_id: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          emergency_number: string | null
          id: string
          name: string
          notes: string | null
          office_number: string | null
          organization_id: string | null
          phone: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          after_hours_number?: string | null
          archived_at?: string | null
          building_id?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_number?: string | null
          id?: string
          name: string
          notes?: string | null
          office_number?: string | null
          organization_id?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          after_hours_number?: string | null
          archived_at?: string | null
          building_id?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_number?: string | null
          id?: string
          name?: string
          notes?: string | null
          office_number?: string | null
          organization_id?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_buildings: {
        Row: {
          building_id: string
          contractor_id: string
          created_at: string
          id: string
        }
        Insert: {
          building_id: string
          contractor_id: string
          created_at?: string
          id?: string
        }
        Update: {
          building_id?: string
          contractor_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_buildings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_buildings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          alt_phone: string | null
          archived_at: string | null
          company_name: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          import_source: string | null
          last_imported_at: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          standard_rate: number | null
          trade: string | null
          updated_at: string
          updated_by: string | null
          vat_number: string | null
        }
        Insert: {
          alt_phone?: string | null
          archived_at?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          import_source?: string | null
          last_imported_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          standard_rate?: number | null
          trade?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
        }
        Update: {
          alt_phone?: string | null
          archived_at?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          import_source?: string | null
          last_imported_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          standard_rate?: number | null
          trade?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          archived_at: string | null
          building_id: string | null
          category: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          leasing_deal_id: string | null
          meeting_id: string | null
          mime_type: string | null
          organization_id: string | null
          site_visit_id: string | null
          tenant_id: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          category?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          leasing_deal_id?: string | null
          meeting_id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          site_visit_id?: string | null
          tenant_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          category?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          leasing_deal_id?: string | null
          meeting_id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          site_visit_id?: string | null
          tenant_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_leasing_deal_id_fkey"
            columns: ["leasing_deal_id"]
            isOneToOne: false
            referencedRelation: "leasing_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_site_visit_id_fkey"
            columns: ["site_visit_id"]
            isOneToOne: false
            referencedRelation: "site_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string | null
          fault_id: string
          id: string
          visible_to_client: boolean
        }
        Insert: {
          comment: string
          created_at?: string
          created_by?: string | null
          fault_id: string
          id?: string
          visible_to_client?: boolean
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string | null
          fault_id?: string
          id?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fault_comments_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          fault_id: string
          from_status: Database["public"]["Enums"]["fault_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["fault_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          fault_id: string
          from_status?: Database["public"]["Enums"]["fault_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["fault_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          fault_id?: string
          from_status?: Database["public"]["Enums"]["fault_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["fault_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fault_status_history_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
        ]
      }
      faults: {
        Row: {
          access_instructions: string | null
          actual_cost: number | null
          archived_at: string | null
          assigned_contractor_id: string | null
          building_id: string
          category: string
          completed_at: string | null
          cost_estimate: number | null
          created_at: string
          created_by: string | null
          description: string
          emergency: boolean
          id: string
          internal_notes: string | null
          invoice_reference: string | null
          organization_id: string
          po_reference: string | null
          priority: Database["public"]["Enums"]["fault_priority"]
          reference: string
          reported_by: string | null
          reporter_contact: string | null
          resolution_details: string | null
          responsibility: string | null
          responsible_person: string | null
          shop_location: string | null
          status: Database["public"]["Enums"]["fault_status"]
          sub_category: string | null
          target_resolution_at: string | null
          target_response_at: string | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_instructions?: string | null
          actual_cost?: number | null
          archived_at?: string | null
          assigned_contractor_id?: string | null
          building_id: string
          category?: string
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          emergency?: boolean
          id?: string
          internal_notes?: string | null
          invoice_reference?: string | null
          organization_id: string
          po_reference?: string | null
          priority?: Database["public"]["Enums"]["fault_priority"]
          reference?: string
          reported_by?: string | null
          reporter_contact?: string | null
          resolution_details?: string | null
          responsibility?: string | null
          responsible_person?: string | null
          shop_location?: string | null
          status?: Database["public"]["Enums"]["fault_status"]
          sub_category?: string | null
          target_resolution_at?: string | null
          target_response_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_instructions?: string | null
          actual_cost?: number | null
          archived_at?: string | null
          assigned_contractor_id?: string | null
          building_id?: string
          category?: string
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          emergency?: boolean
          id?: string
          internal_notes?: string | null
          invoice_reference?: string | null
          organization_id?: string
          po_reference?: string | null
          priority?: Database["public"]["Enums"]["fault_priority"]
          reference?: string
          reported_by?: string | null
          reporter_contact?: string | null
          resolution_details?: string | null
          responsibility?: string | null
          responsible_person?: string | null
          shop_location?: string | null
          status?: Database["public"]["Enums"]["fault_status"]
          sub_category?: string | null
          target_resolution_at?: string | null
          target_response_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faults_assigned_contractor_id_fkey"
            columns: ["assigned_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      important_dates: {
        Row: {
          archived_at: string | null
          building_id: string | null
          created_at: string
          created_by: string | null
          date_type: string | null
          due_date: string
          id: string
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["record_status"]
          tenant_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          date_type?: string | null
          due_date: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          date_type?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "important_dates_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_dates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          archived_at: string | null
          building_id: string | null
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_handover_summary: boolean
          organization_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_handover_summary?: boolean
          organization_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_handover_summary?: boolean
          organization_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          archived_at: string | null
          base_rental: number | null
          building_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          escalation_pct: number | null
          id: string
          lease_end: string | null
          lease_start: string | null
          notes: string | null
          notice_period_days: number | null
          option_period: string | null
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          base_rental?: number | null
          building_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          escalation_pct?: number | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          notes?: string | null
          notice_period_days?: number | null
          option_period?: string | null
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          base_rental?: number | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          escalation_pct?: number | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          notes?: string | null
          notice_period_days?: number | null
          option_period?: string | null
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_approved_rates: {
        Row: {
          archived_at: string | null
          building_id: string
          category: string
          created_at: string
          created_by: string | null
          effective_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          rate_per_sqm: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          category: string
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          rate_per_sqm: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          rate_per_sqm?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leasing_approved_rates_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leasing_approved_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_deal_documents: {
        Row: {
          created_at: string
          deal_id: string
          document_name: string
          id: string
          notes: string | null
          received: boolean
          received_at: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_name: string
          id?: string
          notes?: string | null
          received?: boolean
          received_at?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_name?: string
          id?: string
          notes?: string | null
          received?: boolean
          received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leasing_deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "leasing_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_deal_feedback: {
        Row: {
          comment: string
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leasing_deal_feedback_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "leasing_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_deals: {
        Row: {
          archived_at: string | null
          building_id: string
          commencement_date: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          deal_value: number | null
          enquiry_date: string | null
          enquiry_source: string | null
          id: string
          lease_term_months: number | null
          notes: string | null
          owner: string | null
          prospect_name: string | null
          rate_per_sqm: number | null
          requirements: string | null
          shop_number: string | null
          stage: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id: string | null
          unit_size_sqm: number | null
          updated_at: string
          updated_by: string | null
          vacant_unit_id: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          commencement_date?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deal_value?: number | null
          enquiry_date?: string | null
          enquiry_source?: string | null
          id?: string
          lease_term_months?: number | null
          notes?: string | null
          owner?: string | null
          prospect_name?: string | null
          rate_per_sqm?: number | null
          requirements?: string | null
          shop_number?: string | null
          stage?: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id?: string | null
          unit_size_sqm?: number | null
          updated_at?: string
          updated_by?: string | null
          vacant_unit_id?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          commencement_date?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deal_value?: number | null
          enquiry_date?: string | null
          enquiry_source?: string | null
          id?: string
          lease_term_months?: number | null
          notes?: string | null
          owner?: string | null
          prospect_name?: string | null
          rate_per_sqm?: number | null
          requirements?: string | null
          shop_number?: string | null
          stage?: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id?: string | null
          unit_size_sqm?: number | null
          updated_at?: string
          updated_by?: string | null
          vacant_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leasing_deals_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leasing_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leasing_deals_vacant_unit_id_fkey"
            columns: ["vacant_unit_id"]
            isOneToOne: false
            referencedRelation: "vacant_units"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_document_templates: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          items: Json
          name: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leasing_document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_targets: {
        Row: {
          archived_at: string | null
          building_id: string
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["leasing_target_status"]
          trade_category: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["leasing_target_status"]
          trade_category?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["leasing_target_status"]
          trade_category?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leasing_targets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leasing_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          category: string
          converted_to_action_id: string | null
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string
          note: string
          tenant_id: string | null
        }
        Insert: {
          category?: string
          converted_to_action_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id: string
          note: string
          tenant_id?: string | null
        }
        Update: {
          category?: string
          converted_to_action_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string
          note?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_converted_to_action_id_fkey"
            columns: ["converted_to_action_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          archived_at: string | null
          attendees: string[] | null
          building_id: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_type: string | null
          organization_id: string | null
          pre_meeting_notes: string | null
          raw_transcript: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agenda?: string | null
          archived_at?: string | null
          attendees?: string[] | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_type?: string | null
          organization_id?: string | null
          pre_meeting_notes?: string | null
          raw_transcript?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agenda?: string | null
          archived_at?: string | null
          attendees?: string[] | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_type?: string | null
          organization_id?: string | null
          pre_meeting_notes?: string | null
          raw_transcript?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          portfolio_id: string | null
          portfolio_role: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          portfolio_id?: string | null
          portfolio_role?: string | null
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          portfolio_id?: string | null
          portfolio_role?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      portfolio_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          portfolio_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          portfolio_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          portfolio_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_users_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          archived_at: string | null
          building_id: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string
          escalation_flag: boolean
          id: string
          meeting_id: string | null
          mitigation: string | null
          organization_id: string
          owner: string | null
          severity: string
          site_visit_item_id: string | null
          status: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description: string
          escalation_flag?: boolean
          id?: string
          meeting_id?: string | null
          mitigation?: string | null
          organization_id: string
          owner?: string | null
          severity?: string
          site_visit_item_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          escalation_flag?: boolean
          id?: string
          meeting_id?: string | null
          mitigation?: string | null
          organization_id?: string
          owner?: string | null
          severity?: string
          site_visit_item_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_site_visit_item_id_fkey"
            columns: ["site_visit_item_id"]
            isOneToOne: false
            referencedRelation: "site_visit_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visit_items: {
        Row: {
          category: string
          contractor_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          location: string | null
          notes: string | null
          priority: string
          responsible_person: string | null
          risk_level: string
          site_visit_id: string
          status: string
          target_date: string | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string
          responsible_person?: string | null
          risk_level?: string
          site_visit_id: string
          status?: string
          target_date?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string
          responsible_person?: string | null
          risk_level?: string
          site_visit_id?: string
          status?: string
          target_date?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visit_items_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visit_items_site_visit_id_fkey"
            columns: ["site_visit_id"]
            isOneToOne: false
            referencedRelation: "site_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visit_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visit_photos: {
        Row: {
          caption: string | null
          created_by: string | null
          file_path: string
          id: string
          site_visit_item_id: string
          taken_at: string
        }
        Insert: {
          caption?: string | null
          created_by?: string | null
          file_path: string
          id?: string
          site_visit_item_id: string
          taken_at?: string
        }
        Update: {
          caption?: string | null
          created_by?: string | null
          file_path?: string
          id?: string
          site_visit_item_id?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visit_photos_site_visit_item_id_fkey"
            columns: ["site_visit_item_id"]
            isOneToOne: false
            referencedRelation: "site_visit_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          archived_at: string | null
          attendees: string | null
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          observations: string | null
          photos: string[] | null
          property_manager: string | null
          risks: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          visit_date: string
          visit_type: string | null
          weather: string | null
        }
        Insert: {
          archived_at?: string | null
          attendees?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          photos?: string[] | null
          property_manager?: string | null
          risks?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          visit_date: string
          visit_type?: string | null
          weather?: string | null
        }
        Update: {
          archived_at?: string | null
          attendees?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          photos?: string[] | null
          property_manager?: string | null
          risks?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          visit_date?: string
          visit_type?: string | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_contacts: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          role: string
          tenant_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          role: string
          tenant_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          account_number: string | null
          annual_turnover_required: boolean
          archived_at: string | null
          bank_guarantee_reference: string | null
          building_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          deposit_received: boolean
          deposit_type: string | null
          escalation_date: string | null
          escalation_pct: number | null
          fica_status: string | null
          financial_year_end_day: number | null
          financial_year_end_month: number | null
          gla: number | null
          guarantee_received: boolean
          id: string
          import_source: string | null
          insurance_status: string | null
          lease_end: string | null
          lease_signed: boolean
          lease_start: string | null
          marketing_charge: number | null
          monthly_rental: number | null
          monthly_turnover_required: boolean
          notes: string | null
          operating_costs: number | null
          option_period: string | null
          other_charges: number | null
          rates: number | null
          registered_entity: string | null
          security_notes: string | null
          shop_number: string | null
          status: Database["public"]["Enums"]["record_status"]
          surety_expiry: string | null
          surety_name: string | null
          surety_received: boolean
          trading_name: string
          turnover_pct: number | null
          turnover_penalty_amount: number | null
          turnover_penalty_clause: string | null
          turnover_reporting_required: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          annual_turnover_required?: boolean
          archived_at?: string | null
          bank_guarantee_reference?: string | null
          building_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_received?: boolean
          deposit_type?: string | null
          escalation_date?: string | null
          escalation_pct?: number | null
          fica_status?: string | null
          financial_year_end_day?: number | null
          financial_year_end_month?: number | null
          gla?: number | null
          guarantee_received?: boolean
          id?: string
          import_source?: string | null
          insurance_status?: string | null
          lease_end?: string | null
          lease_signed?: boolean
          lease_start?: string | null
          marketing_charge?: number | null
          monthly_rental?: number | null
          monthly_turnover_required?: boolean
          notes?: string | null
          operating_costs?: number | null
          option_period?: string | null
          other_charges?: number | null
          rates?: number | null
          registered_entity?: string | null
          security_notes?: string | null
          shop_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          surety_expiry?: string | null
          surety_name?: string | null
          surety_received?: boolean
          trading_name: string
          turnover_pct?: number | null
          turnover_penalty_amount?: number | null
          turnover_penalty_clause?: string | null
          turnover_reporting_required?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          annual_turnover_required?: boolean
          archived_at?: string | null
          bank_guarantee_reference?: string | null
          building_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          deposit_received?: boolean
          deposit_type?: string | null
          escalation_date?: string | null
          escalation_pct?: number | null
          fica_status?: string | null
          financial_year_end_day?: number | null
          financial_year_end_month?: number | null
          gla?: number | null
          guarantee_received?: boolean
          id?: string
          import_source?: string | null
          insurance_status?: string | null
          lease_end?: string | null
          lease_signed?: boolean
          lease_start?: string | null
          marketing_charge?: number | null
          monthly_rental?: number | null
          monthly_turnover_required?: boolean
          notes?: string | null
          operating_costs?: number | null
          option_period?: string | null
          other_charges?: number | null
          rates?: number | null
          registered_entity?: string | null
          security_notes?: string | null
          shop_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          surety_expiry?: string | null
          surety_name?: string | null
          surety_received?: boolean
          trading_name?: string
          turnover_pct?: number | null
          turnover_penalty_amount?: number | null
          turnover_penalty_clause?: string | null
          turnover_reporting_required?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      turnover_annual_certificates: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          due_date: string
          financial_year: number
          id: string
          notes: string | null
          received_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date: string
          financial_year: number
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string
          financial_year?: number
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnover_annual_certificates_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnover_annual_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnover_annual_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      turnovers: {
        Row: {
          archived_at: string | null
          building_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          due_date: string | null
          id: string
          import_source: string | null
          notes: string | null
          penalty_amount: number | null
          penalty_applicable: boolean
          penalty_status: string | null
          period: string
          status: string
          submitted: boolean
          submitted_at: string | null
          tenant_id: string
          turnover_amount: number | null
          turnover_rental: number | null
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          import_source?: string | null
          notes?: string | null
          penalty_amount?: number | null
          penalty_applicable?: boolean
          penalty_status?: string | null
          period: string
          status?: string
          submitted?: boolean
          submitted_at?: string | null
          tenant_id: string
          turnover_amount?: number | null
          turnover_rental?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          import_source?: string | null
          notes?: string | null
          penalty_amount?: number | null
          penalty_applicable?: boolean
          penalty_status?: string | null
          period?: string
          status?: string
          submitted?: boolean
          submitted_at?: string | null
          tenant_id?: string
          turnover_amount?: number | null
          turnover_rental?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnovers_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnovers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnovers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vacant_units: {
        Row: {
          archived_at: string | null
          asking_rate_per_sqm: number | null
          availability_date: string | null
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string | null
          shop_number: string | null
          size_sqm: number | null
          status: Database["public"]["Enums"]["vacant_unit_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          asking_rate_per_sqm?: number | null
          availability_date?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          shop_number?: string | null
          size_sqm?: number | null
          status?: Database["public"]["Enums"]["vacant_unit_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          asking_rate_per_sqm?: number | null
          availability_date?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          shop_number?: string | null
          size_sqm?: number | null
          status?: Database["public"]["Enums"]["vacant_unit_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacant_units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacant_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: undefined }
      can_manage_building_assignment: {
        Args: { target_building_id: string }
        Returns: boolean
      }
      contractor_buildings_accessible: {
        Args: { target_contractor_id: string }
        Returns: boolean
      }
      contractor_org_check: {
        Args: { target_contractor_id: string }
        Returns: boolean
      }
      find_org_member_by_email: {
        Args: { target_email: string }
        Returns: {
          already_org_member: boolean
          user_id: string
        }[]
      }
      org_member_emails: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      user_accessible_building_ids: { Args: never; Returns: string[] }
      user_accessible_portfolio_ids: { Args: never; Returns: string[] }
      user_org_ids: { Args: never; Returns: string[] }
      user_portfolio_wide_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      contact_type:
        | "tenant"
        | "landlord"
        | "contractor"
        | "consultant"
        | "attorney"
        | "internal"
        | "other"
        | "tenant_owner"
        | "tenant_manager"
        | "emergency"
        | "security"
        | "cleaning"
        | "facilities"
        | "electrician"
        | "plumber"
        | "fire"
        | "asset_manager"
        | "property_manager"
        | "leasing"
        | "legal"
        | "municipal"
      fault_priority: "low" | "normal" | "high" | "critical" | "emergency"
      fault_status:
        | "new"
        | "acknowledged"
        | "assigned"
        | "in_progress"
        | "waiting_on_contractor"
        | "waiting_on_client"
        | "on_hold"
        | "quote_required"
        | "approval_required"
        | "resolved"
        | "closed"
        | "cancelled"
      lease_status:
        | "active"
        | "expired"
        | "terminated"
        | "pending"
        | "renewal_in_progress"
      leasing_deal_stage:
        | "enquiry"
        | "offer"
        | "negotiation"
        | "signed"
        | "declined"
        | "withdrawn"
      leasing_target_status:
        | "to_approach"
        | "contacted"
        | "meeting_set"
        | "interested"
        | "not_interested"
        | "converted"
      meeting_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "archived"
      priority_level: "low" | "medium" | "high" | "critical"
      record_status:
        | "not_started"
        | "in_progress"
        | "waiting_on_feedback"
        | "complete"
      vacant_unit_status: "vacant" | "under_offer" | "leased"
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
      contact_type: [
        "tenant",
        "landlord",
        "contractor",
        "consultant",
        "attorney",
        "internal",
        "other",
        "tenant_owner",
        "tenant_manager",
        "emergency",
        "security",
        "cleaning",
        "facilities",
        "electrician",
        "plumber",
        "fire",
        "asset_manager",
        "property_manager",
        "leasing",
        "legal",
        "municipal",
      ],
      fault_priority: ["low", "normal", "high", "critical", "emergency"],
      fault_status: [
        "new",
        "acknowledged",
        "assigned",
        "in_progress",
        "waiting_on_contractor",
        "waiting_on_client",
        "on_hold",
        "quote_required",
        "approval_required",
        "resolved",
        "closed",
        "cancelled",
      ],
      lease_status: [
        "active",
        "expired",
        "terminated",
        "pending",
        "renewal_in_progress",
      ],
      leasing_deal_stage: [
        "enquiry",
        "offer",
        "negotiation",
        "signed",
        "declined",
        "withdrawn",
      ],
      leasing_target_status: [
        "to_approach",
        "contacted",
        "meeting_set",
        "interested",
        "not_interested",
        "converted",
      ],
      meeting_status: [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "archived",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      record_status: [
        "not_started",
        "in_progress",
        "waiting_on_feedback",
        "complete",
      ],
      vacant_unit_status: ["vacant", "under_offer", "leased"],
    },
  },
} as const
