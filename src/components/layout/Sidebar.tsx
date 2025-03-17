import React from "react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import {
  Home,
  BarChart3,
  Package,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "../auth/AuthProvider";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = ({ collapsed = false, onToggleCollapse }: SidebarProps) => {
  const { userRole } = useAuth();

  return (
    <div
      className={cn(
        "h-full bg-background border-r flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-[280px]",
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <div className="font-bold text-xl">FinTrack</div>}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="font-bold text-xl">FT</div>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          <NavItem
            icon={<Home size={20} />}
            label="Dashboard"
            to="/"
            collapsed={collapsed}
          />
          <NavItem
            icon={<BarChart3 size={20} />}
            label="Accounting"
            to="/accounting"
            collapsed={collapsed}
            roles={["accountant", "branch_manager", "general_manager"]}
            userRole={userRole}
          />
          <NavItem
            icon={<Package size={20} />}
            label="Inventory"
            to="/inventory"
            collapsed={collapsed}
            roles={["branch_manager", "general_manager"]}
            userRole={userRole}
          />
          <NavItem
            icon={<Users size={20} />}
            label="Users"
            to="/users"
            collapsed={collapsed}
            roles={["general_manager"]}
            userRole={userRole}
          />
        </nav>
      </div>

      <Separator />

      {/* Bottom actions */}
      <div className="p-4 space-y-2">
        <NavItem
          icon={<Settings size={20} />}
          label="Settings"
          to="/settings"
          collapsed={collapsed}
        />
        <NavItem
          icon={<HelpCircle size={20} />}
          label="Help & Support"
          to="/help"
          collapsed={collapsed}
        />
        <NavItem
          icon={<LogOut size={20} />}
          label="Logout"
          to="/logout"
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  collapsed?: boolean;
  roles?: string[];
  userRole?: string | null;
}

const NavItem = ({
  icon,
  label,
  to,
  collapsed = false,
  roles,
  userRole,
}: NavItemProps) => {
  // Check if user has access to this menu item
  if (roles && userRole && !roles.includes(userRole)) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <NavLink
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center" : "justify-start",
              )
            }
          >
            <div className="flex items-center">
              <span className="mr-3">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </div>
          </NavLink>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

export default Sidebar;
