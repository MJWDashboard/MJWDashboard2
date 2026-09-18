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
          tenant_id: string
        }
        Insert: {
          archived_at?: string | null
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
          tenant_id: string
        }
        Update: {
          archived_at?: string | null
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
          tenant_id?: string
        }
        Relationships: [
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
          as_of_month: string | null
          building_id: string
          current_balance: number
          days_30: number | null
          days_60: number | null
          days_90_plus: number | null
          id: string
          last_imported_at: string | null
          last_imported_source: string | null
          status: Database["public"]["Enums"]["record_status"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          as_of_month?: string | null
          building_id: string
          current_balance?: number
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          id?: string
          last_imported_at?: string | null
          last_imported_source?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          as_of_month?: string | null
          building_id?: string
          current_balance?: number
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          id?: string
          last_imported_at?: string | null
          last_imported_source?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          tenant_id?: string
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
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arrears_history: {
        Row: {
          as_of_month: string
          balance: number
          building_id: string
          days_30: number | null
          days_60: number | null
          days_90_plus: number | null
          id: string
          import_source: string | null
          imported_at: string
          tenant_id: string
        }
        Insert: {
          as_of_month: string
          balance: number
          building_id: string
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          id?: string
          import_source?: string | null
          imported_at?: string
          tenant_id: string
        }
        Update: {
          as_of_month?: string
          balance?: number
          building_id?: string
          days_30?: number | null
          days_60?: number | null
          days_90_plus?: number | null
          id?: string
          import_source?: string | null
          imported_at?: string
          tenant_id?: string
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
          portfolio: string | null
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
          portfolio?: string | null
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
          portfolio?: string | null
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
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          building_id: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
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
      contractors: {
        Row: {
          archived_at: string | null
          building_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string | null
          rating: number | null
          trade: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          rating?: number | null
          trade?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          rating?: number | null
          trade?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
      leasing_deals: {
        Row: {
          archived_at: string | null
          building_id: string
          created_at: string
          created_by: string | null
          deal_value: number | null
          id: string
          notes: string | null
          owner: string | null
          prospect_name: string | null
          shop_number: string | null
          stage: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          deal_value?: number | null
          id?: string
          notes?: string | null
          owner?: string | null
          prospect_name?: string | null
          shop_number?: string | null
          stage?: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          deal_value?: number | null
          id?: string
          notes?: string | null
          owner?: string | null
          prospect_name?: string | null
          shop_number?: string | null
          stage?: Database["public"]["Enums"]["leasing_deal_stage"]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
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
        ]
      }
      meeting_notes: {
        Row: {
          converted_to_action_id: string | null
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string
          note: string
          tenant_id: string | null
        }
        Insert: {
          converted_to_action_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id: string
          note: string
          tenant_id?: string | null
        }
        Update: {
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
          meeting_date: string
          organization_id: string | null
          status: Database["public"]["Enums"]["record_status"]
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
          meeting_date: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
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
          meeting_date?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
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
      site_visits: {
        Row: {
          archived_at: string | null
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          observations: string | null
          photos: string[] | null
          risks: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          visit_date: string
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          photos?: string[] | null
          risks?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          visit_date: string
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          photos?: string[] | null
          risks?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          visit_date?: string
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
      tenants: {
        Row: {
          archived_at: string | null
          building_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          gla: number | null
          id: string
          import_source: string | null
          lease_end: string | null
          lease_start: string | null
          monthly_rental: number | null
          notes: string | null
          shop_number: string | null
          status: Database["public"]["Enums"]["record_status"]
          trading_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          gla?: number | null
          id?: string
          import_source?: string | null
          lease_end?: string | null
          lease_start?: string | null
          monthly_rental?: number | null
          notes?: string | null
          shop_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          trading_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          gla?: number | null
          id?: string
          import_source?: string | null
          lease_end?: string | null
          lease_start?: string | null
          monthly_rental?: number | null
          notes?: string | null
          shop_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          trading_name?: string
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
      turnovers: {
        Row: {
          archived_at: string | null
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          import_source: string | null
          notes: string | null
          period: string
          submitted: boolean
          submitted_at: string | null
          tenant_id: string
          turnover_amount: number | null
          turnover_rental: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          import_source?: string | null
          notes?: string | null
          period: string
          submitted?: boolean
          submitted_at?: string | null
          tenant_id: string
          turnover_amount?: number | null
          turnover_rental?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          import_source?: string | null
          notes?: string | null
          period?: string
          submitted?: boolean
          submitted_at?: string | null
          tenant_id?: string
          turnover_amount?: number | null
          turnover_rental?: number | null
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
            foreignKeyName: "turnovers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      user_org_ids: { Args: never; Returns: string[] }
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
      priority_level: "low" | "medium" | "high" | "critical"
      record_status:
        | "not_started"
        | "in_progress"
        | "waiting_on_feedback"
        | "complete"
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
      priority_level: ["low", "medium", "high", "critical"],
      record_status: [
        "not_started",
        "in_progress",
        "waiting_on_feedback",
        "complete",
      ],
    },
  },
} as const
