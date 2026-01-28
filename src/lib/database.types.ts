export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          name: string
          description: string
          type: string
          config: Json
          icon: string
          color: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          type: string
          config?: Json
          icon?: string
          color?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: string
          config?: Json
          icon?: string
          color?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string
          definition: Json
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          definition?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          definition?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_nodes: {
        Row: {
          id: string
          workflow_id: string
          module_id: string
          node_id: string
          position: Json
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          module_id: string
          node_id: string
          position?: Json
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          module_id?: string
          node_id?: string
          position?: Json
          data?: Json
          created_at?: string
        }
        Relationships: []
      }
      workflow_edges: {
        Row: {
          id: string
          workflow_id: string
          edge_id: string
          source_node_id: string
          target_node_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          edge_id: string
          source_node_id: string
          target_node_id: string
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          edge_id?: string
          source_node_id?: string
          target_node_id?: string
          created_at?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          id: string
          name: string
          description: string
          workflow_id: string | null
          parameters: Json
          sop_content: string
          flowchart_data: Json
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          workflow_id?: string | null
          parameters?: Json
          sop_content?: string
          flowchart_data?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          workflow_id?: string | null
          parameters?: Json
          sop_content?: string
          flowchart_data?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      execution_logs: {
        Row: {
          id: string
          scenario_id: string | null
          workflow_id: string | null
          parameters: Json
          status: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id?: string | null
          workflow_id?: string | null
          parameters?: Json
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scenario_id?: string | null
          workflow_id?: string | null
          parameters?: Json
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          phone: string | null
          role: 'super_admin' | 'admin' | 'read_write' | 'read_only'
          status: 'active' | 'locked' | 'pending' | 'deleted'
          created_at: string
          updated_at: string
          created_by: string | null
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'read_write' | 'read_only'
          status?: 'active' | 'locked' | 'pending' | 'deleted'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'read_write' | 'read_only'
          status?: 'active' | 'locked' | 'pending' | 'deleted'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
        Relationships: []
      }
      account_requests: {
        Row: {
          id: string
          email: string
          phone: string | null
          requested_role: 'read_write' | 'read_only'
          reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          requested_role?: 'read_write' | 'read_only'
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          requested_role?: 'read_write' | 'read_only'
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sop_documents: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          tags: string[]
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category?: string
          tags?: string[]
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[]
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_configs: {
        Row: {
          id: string
          provider: string
          model: string
          api_key: string
          api_base_url: string | null
          temperature: number
          max_tokens: number
          is_active: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          model: string
          api_key: string
          api_base_url?: string | null
          temperature?: number
          max_tokens?: number
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          model?: string
          api_key?: string
          api_base_url?: string | null
          temperature?: number
          max_tokens?: number
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
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

export type Module = Database['public']['Tables']['modules']['Row']
export type Workflow = Database['public']['Tables']['workflows']['Row']
export type WorkflowNode = Database['public']['Tables']['workflow_nodes']['Row']
export type WorkflowEdge = Database['public']['Tables']['workflow_edges']['Row']
export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type ExecutionLog = Database['public']['Tables']['execution_logs']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type AccountRequest = Database['public']['Tables']['account_requests']['Row']
export type SOPDocument = Database['public']['Tables']['sop_documents']['Row']
export type AIConfig = Database['public']['Tables']['ai_configs']['Row']
