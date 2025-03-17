import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthUser, UserRole, getCurrentUser } from "@/lib/auth";

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setSession(data.session);

        if (data.session) {
          const { user: currentUser, error: userError } =
            await getCurrentUser();
          if (userError) throw userError;

          setUser(currentUser);
          setUserRole(currentUser?.user_metadata.role || null);
        }
      } catch (error: any) {
        console.error("Error fetching session:", error);
        setError(error.message);
      } finally {
        // Ensure loading state is set to false even if there's an error
        setIsLoading(false);
      }
    };

    // Execute the fetch session function immediately
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session) {
          try {
            const { user: currentUser } = await getCurrentUser();
            setUser(currentUser);
            setUserRole(currentUser?.user_metadata.role || null);
          } catch (error) {
            console.error("Error in auth state change:", error);
            setUser(null);
            setUserRole(null);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }

        // Always set loading to false after auth state changes
        setIsLoading(false);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, userRole, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
