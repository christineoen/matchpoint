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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          surface_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          surface_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          surface_type?: string
        }
        Relationships: []
      }
      event_courts: {
        Row: {
          court_id: string
          event_id: string
          id: string
          selection_order: number
        }
        Insert: {
          court_id: string
          event_id: string
          id?: string
          selection_order: number
        }
        Update: {
          court_id?: string
          event_id?: string
          id?: string
          selection_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_courts_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_courts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_players: {
        Row: {
          arrival_order: number
          checked_in: boolean | null
          event_id: string
          id: string
          player_id: string
        }
        Insert: {
          arrival_order: number
          checked_in?: boolean | null
          event_id: string
          id?: string
          player_id: string
        }
        Update: {
          arrival_order?: number
          checked_in?: boolean | null
          event_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_players_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string
          created_at: string | null
          end_time: string | null
          event_date: string
          id: string
          location: string | null
          name: string
          organizer_id: string | null
          start_time: string | null
          status: string | null
          total_sets: number | null
          updated_at: string | null
        }
        Insert: {
          club_id: string
          created_at?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          location?: string | null
          name: string
          organizer_id?: string | null
          start_time?: string | null
          status?: string | null
          total_sets?: number | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string | null
          name?: string
          organizer_id?: string | null
          start_time?: string | null
          status?: string | null
          total_sets?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_history: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          player1_id: string
          player2_id: string
          relationship: string
          set_number: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          player1_id: string
          player2_id: string
          relationship: string
          set_number: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          player1_id?: string
          player2_id?: string
          relationship?: string
          set_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_history_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_history_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          id: string
          match_id: string
          player_id: string
          position: number
          team: number
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          position: number
          team: number
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          position?: number
          team?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court_id: string
          created_at: string | null
          event_id: string
          format: string
          id: string
          is_manual: boolean | null
          notes: string | null
          set_number: number
        }
        Insert: {
          court_id: string
          created_at?: string | null
          event_id: string
          format: string
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          set_number: number
        }
        Update: {
          court_id?: string
          created_at?: string | null
          event_id?: string
          format?: string
          id?: string
          is_manual?: boolean | null
          notes?: string | null
          set_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club_id: string
          created_at: string | null
          email: string | null
          gender: string
          grade: number
          id: string
          is_active: boolean | null
          name: string
          nhc: boolean | null
          notes: string | null
          phone: string | null
          plus_minus: string | null
          updated_at: string | null
        }
        Insert: {
          club_id: string
          created_at?: string | null
          email?: string | null
          gender: string
          grade: number
          id?: string
          is_active?: boolean | null
          name: string
          nhc?: boolean | null
          notes?: string | null
          phone?: string | null
          plus_minus?: string | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string | null
          email?: string | null
          gender?: string
          grade?: number
          id?: string
          is_active?: boolean | null
          name?: string
          nhc?: boolean | null
          notes?: string | null
          phone?: string | null
          plus_minus?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// Convenience type exports for common table types
export type Event = Database['public']['Tables']['events']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Court = Database['public']['Tables']['courts']['Row']
export type ClubMember = Database['public']['Tables']['club_members']['Row']
export type Club = Database['public']['Tables']['clubs']['Row']
export type EventPlayer = Database['public']['Tables']['event_players']['Row']
export type EventCourt = Database['public']['Tables']['event_courts']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchPlayer = Database['public']['Tables']['match_players']['Row']
export type MatchHistory = Database['public']['Tables']['match_history']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
