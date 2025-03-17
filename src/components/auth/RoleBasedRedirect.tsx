import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

const RoleBasedRedirect: React.FC = () => {
  const { user, userRole, isLoading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && userRole) {
      switch (userRole) {
        case "accountant":
          setRedirectPath("/dashboard/accountant");
          break;
        case "branch_manager":
          setRedirectPath("/dashboard/branch-manager");
          break;
        case "general_manager":
          setRedirectPath("/dashboard/general-manager");
          break;
        default:
          setRedirectPath("/dashboard");
      }
    } else if (!isLoading && !user) {
      setRedirectPath("/");
    }
  }, [user, userRole, isLoading]);

  if (isLoading || redirectPath === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-lg">جاري التحميل...</span>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedRedirect;
