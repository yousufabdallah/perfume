import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { useAuth } from "../auth/AuthProvider";

interface AppLayoutProps {
  children?: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  notificationCount?: number;
  defaultCollapsed?: boolean;
}

const AppLayout = ({ children, defaultCollapsed = false }: AppLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-[280px]",
        )}
      >
        {/* Header */}
        <Header
          userName={
            user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
          }
          userEmail={user?.email || ""}
          userAvatar=""
          notificationCount={3}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
