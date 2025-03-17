import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export type UserRole = "accountant" | "branch_manager" | "general_manager";

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    role?: UserRole;
  };
}

export const signIn = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const signUp = async ({
  email,
  password,
  fullName,
  role,
}: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user as AuthUser | null, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const { user, error } = await getCurrentUser();
    if (error || !user) return null;
    return user.user_metadata.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { user } = await getCurrentUser();
  return !!user;
};

export const hasRole = async (
  requiredRole: UserRole | UserRole[],
): Promise<boolean> => {
  const userRole = await getUserRole();
  if (!userRole) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return userRole === requiredRole;
};
