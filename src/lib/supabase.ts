import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  // Provide fallback values for development to prevent crashes
  if (!supabaseUrl) supabaseUrl = "https://example.supabase.co";
  if (!supabaseAnonKey) supabaseAnonKey = "public-anon-key";
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Branch = Tables<"branches">;
export type Product = Tables<"products">;
export type Inventory = Tables<"inventory">;
export type FinancialTransaction = Tables<"financial_transactions">;
export type InventoryTransfer = Tables<"inventory_transfers">;
export type InventoryTransferItem = Tables<"inventory_transfer_items">;
export type User = Tables<"users">;
export type UserRole = Enums<"user_role">;
