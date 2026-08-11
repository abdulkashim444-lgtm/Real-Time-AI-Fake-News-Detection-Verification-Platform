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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          confidence: number
          content: string
          contradiction_score: number
          created_at: string
          domain: string | null
          evidence_latency_ms: number
          evidence_score: number
          explanations: Json
          factcheck_latency_ms: number
          factcheck_match: boolean
          id: string
          language: string | null
          linguistic_features: Json
          ml_label: string
          ml_latency_ms: number
          ml_probability: number
          model_version: string
          processing_time_ms: number
          service_status: Json
          source_score: number
          title: string
          url: string | null
          verdict: string
        }
        Insert: {
          confidence: number
          content: string
          contradiction_score?: number
          created_at?: string
          domain?: string | null
          evidence_latency_ms?: number
          evidence_score?: number
          explanations?: Json
          factcheck_latency_ms?: number
          factcheck_match?: boolean
          id?: string
          language?: string | null
          linguistic_features?: Json
          ml_label: string
          ml_latency_ms?: number
          ml_probability: number
          model_version: string
          processing_time_ms?: number
          service_status?: Json
          source_score?: number
          title: string
          url?: string | null
          verdict: string
        }
        Update: {
          confidence?: number
          content?: string
          contradiction_score?: number
          created_at?: string
          domain?: string | null
          evidence_latency_ms?: number
          evidence_score?: number
          explanations?: Json
          factcheck_latency_ms?: number
          factcheck_match?: boolean
          id?: string
          language?: string | null
          linguistic_features?: Json
          ml_label?: string
          ml_latency_ms?: number
          ml_probability?: number
          model_version?: string
          processing_time_ms?: number
          service_status?: Json
          source_score?: number
          title?: string
          url?: string | null
          verdict?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          analysis_id: string
          claim_text: string
          claim_type: string
          created_at: string
          id: string
          importance: number
        }
        Insert: {
          analysis_id: string
          claim_text: string
          claim_type?: string
          created_at?: string
          id?: string
          importance?: number
        }
        Update: {
          analysis_id?: string
          claim_text?: string
          claim_type?: string
          created_at?: string
          id?: string
          importance?: number
        }
        Relationships: [
          {
            foreignKeyName: "claims_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          analysis_id: string
          claim_id: string | null
          created_at: string
          credibility_score: number
          evidence_type: string
          id: string
          published_at: string | null
          publisher: string | null
          rationale: string | null
          similarity_score: number
          snippet: string | null
          title: string
          url: string | null
        }
        Insert: {
          analysis_id: string
          claim_id?: string | null
          created_at?: string
          credibility_score?: number
          evidence_type?: string
          id?: string
          published_at?: string | null
          publisher?: string | null
          rationale?: string | null
          similarity_score?: number
          snippet?: string | null
          title: string
          url?: string | null
        }
        Update: {
          analysis_id?: string
          claim_id?: string | null
          created_at?: string
          credibility_score?: number
          evidence_type?: string
          id?: string
          published_at?: string | null
          publisher?: string | null
          rationale?: string | null
          similarity_score?: number
          snippet?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_checks: {
        Row: {
          analysis_id: string
          claim_date: string | null
          claim_id: string | null
          created_at: string
          id: string
          match_score: number
          matched_claim: string | null
          publisher: string | null
          rating: string | null
          review_url: string | null
        }
        Insert: {
          analysis_id: string
          claim_date?: string | null
          claim_id?: string | null
          created_at?: string
          id?: string
          match_score?: number
          matched_claim?: string | null
          publisher?: string | null
          rating?: string | null
          review_url?: string | null
        }
        Update: {
          analysis_id?: string
          claim_date?: string | null
          claim_id?: string | null
          created_at?: string
          id?: string
          match_score?: number
          matched_claim?: string | null
          publisher?: string | null
          rating?: string | null
          review_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_checks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_checks_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      model_metrics: {
        Row: {
          accuracy: number | null
          confusion_matrix: Json | null
          created_at: string
          dataset: string | null
          f1: number | null
          id: string
          model_version: string
          notes: string | null
          precision_score: number | null
          recall: number | null
          roc_auc: number | null
          sample_size: number | null
        }
        Insert: {
          accuracy?: number | null
          confusion_matrix?: Json | null
          created_at?: string
          dataset?: string | null
          f1?: number | null
          id?: string
          model_version: string
          notes?: string | null
          precision_score?: number | null
          recall?: number | null
          roc_auc?: number | null
          sample_size?: number | null
        }
        Update: {
          accuracy?: number | null
          confusion_matrix?: Json | null
          created_at?: string
          dataset?: string | null
          f1?: number | null
          id?: string
          model_version?: string
          notes?: string | null
          precision_score?: number | null
          recall?: number | null
          roc_auc?: number | null
          sample_size?: number | null
        }
        Relationships: []
      }
      sources: {
        Row: {
          article_count: number
          category: string | null
          country: string | null
          created_at: string
          credibility_score: number
          domain: string
          id: string
          last_seen_at: string
          publisher: string | null
          signals: Json
        }
        Insert: {
          article_count?: number
          category?: string | null
          country?: string | null
          created_at?: string
          credibility_score?: number
          domain: string
          id?: string
          last_seen_at?: string
          publisher?: string | null
          signals?: Json
        }
        Update: {
          article_count?: number
          category?: string | null
          country?: string | null
          created_at?: string
          credibility_score?: number
          domain?: string
          id?: string
          last_seen_at?: string
          publisher?: string | null
          signals?: Json
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
