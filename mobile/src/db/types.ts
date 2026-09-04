/**
 * Database types — GENERATED from supabase/migrations. Do not edit by hand.
 *
 * Regenerated whenever a migration is added, so this always matches what is actually in the
 * database. Anything written here by hand is lost on the next migration.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string;
          account_status: string;
          created_at: string;
          hagana_id: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          phone: string;
          account_status?: string;
          created_at?: string;
          hagana_id?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string;
          account_status?: string;
          created_at?: string;
          hagana_id?: string | null;
          avatar_url?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          title: string;
          type: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          amount?: number;
          created_at?: string;
        };
      };
      transfers: {
        Row: {
          reference: string;
          user_id: string;
          counterparty: string | null;
          direction: string;
          type: string;
          amount: number;
          currency: string;
          status: string;
          created_at: string;
        };
        Insert: {
          reference: string;
          user_id: string;
          counterparty?: string | null;
          direction: string;
          type?: string;
          amount: number;
          currency?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          reference?: string;
          user_id?: string;
          counterparty?: string | null;
          direction?: string;
          type?: string;
          amount?: number;
          currency?: string;
          status?: string;
          created_at?: string;
        };
      };
      user_security: {
        Row: {
          user_id: string;
          pin_hash: string;
          pin_set_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pin_hash: string;
          pin_set_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          pin_hash?: string;
          pin_set_at?: string;
          updated_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Transfer = Database['public']['Tables']['transfers']['Row'];
export type UserSecurity = Database['public']['Tables']['user_security']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
