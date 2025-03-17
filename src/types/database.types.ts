export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      financial_transactions: {
        Row: {
          id: string;
          branch_id: string;
          transaction_type: string;
          amount: number;
          description: string | null;
          reference_number: string | null;
          transaction_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          transaction_type: string;
          amount: number;
          description?: string | null;
          reference_number?: string | null;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          transaction_type?: string;
          amount?: number;
          description?: string | null;
          reference_number?: string | null;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          branch_id: string;
          product_id: string;
          quantity: number;
          min_quantity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          product_id: string;
          quantity?: number;
          min_quantity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          product_id?: string;
          quantity?: number;
          min_quantity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_transfer_items: {
        Row: {
          id: string;
          transfer_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transfer_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transfer_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_transfers: {
        Row: {
          id: string;
          from_branch_id: string;
          to_branch_id: string;
          status: string;
          requested_by: string | null;
          approved_by: string | null;
          request_date: string;
          completion_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_branch_id: string;
          to_branch_id: string;
          status?: string;
          requested_by?: string | null;
          approved_by?: string | null;
          request_date?: string;
          completion_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_branch_id?: string;
          to_branch_id?: string;
          status?: string;
          requested_by?: string | null;
          approved_by?: string | null;
          request_date?: string;
          completion_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sku: string | null;
          price: number;
          cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          price: number;
          cost: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          price?: number;
          cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          role?: Database["public"]["Enums"]["user_role"];
          branch_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
          branch_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_user_with_role: {
        Args: {
          email: string;
          password: string;
          full_name: string;
          user_role: Database["public"]["Enums"]["user_role"];
          branch_id: string;
        };
        Returns: string;
      };
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      get_user_branch_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_branch_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_general_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "accountant" | "branch_manager" | "general_manager";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
