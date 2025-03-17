import React from "react";
import AuthContainer from "./auth/AuthContainer";
import DashboardHome from "./dashboard/DashboardHome";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { signIn, signUp } from "@/lib/auth";

const Home: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authLoading, setAuthLoading] = React.useState<boolean>(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = await signIn({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
    } catch (error: any) {
      setAuthError(error || "فشل تسجيل الدخول");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (values: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role as any,
      });

      if (error) throw error;
    } catch (error: any) {
      setAuthError(error || "فشل إنشاء الحساب");
    } finally {
      setAuthLoading(false);
    }
  };

  // Add a timeout to prevent infinite loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, forcing render");
        setAuthLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-lg">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? (
        <DashboardHome
          userName={user.user_metadata?.full_name || user.email.split("@")[0]}
          lastLogin="Today at 9:00 AM" // This would ideally come from your database
          activeUsers={12} // This would ideally be calculated from active sessions
        />
      ) : (
        <AuthContainer
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={authLoading}
          error={authError}
        />
      )}
    </div>
  );
};

export default Home;
