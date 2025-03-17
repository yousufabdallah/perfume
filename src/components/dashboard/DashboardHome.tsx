import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AccountantDashboard from "./AccountantDashboard";
import ManagerDashboard from "./ManagerDashboard";
import BranchManagerDashboard from "./BranchManagerDashboard";
import OverviewCards from "./OverviewCards";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users, TrendingUp } from "lucide-react";

interface DashboardHomeProps {
  userName?: string;
  userRole?: string;
  lastLogin?: string;
  activeUsers?: number;
}

const DashboardHome = ({
  userName = "المستخدم",
  userRole = "branch_manager",
  lastLogin = "Today at 8:30 AM",
  activeUsers = 5,
}: DashboardHomeProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState(userRole);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          setUser(authData.user);

          // Fetch user details from the users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*, branch:branches(*)")
            .eq("id", authData.user.id)
            .single();

          if (userError) {
            console.warn("Error fetching user details:", userError);
            // Continue with default role if there's an error
            setCurrentRole(userRole);
          } else if (userData) {
            // Override the role from props with the actual user role
            setCurrentRole(userData.role || userRole);
            setUserBranch(userData.branch_id);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        // Always set loading to false, even if there are errors
        setLoading(false);
      }
    };

    // Set a timeout to ensure loading state doesn't get stuck
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Dashboard loading timeout reached, forcing render");
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    fetchUserData();

    return () => clearTimeout(timeoutId);
  }, [userRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  // Render the appropriate dashboard based on user role
  switch (currentRole) {
    case "general_manager":
      return <ManagerDashboard />;
    case "accountant":
      return <AccountantDashboard branchId={userBranch || undefined} />;
    case "branch_manager":
      return <BranchManagerDashboard branchId={userBranch || undefined} />;
    default:
      // Fallback to the generic dashboard
      return (
        <div className="w-full h-full p-6 bg-slate-50">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {userName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Last login: {lastLogin} | {activeUsers} active users
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Card className="bg-white p-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date().toLocaleDateString()}
                </span>
              </Card>
              <Card className="bg-white p-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{activeUsers} online</span>
              </Card>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="mb-8">
            <OverviewCards />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-0">
                <RecentActivity />
              </TabsContent>

              <TabsContent value="performance" className="space-y-0">
                <Card className="w-full h-[400px] bg-white">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[300px]">
                    <div className="flex flex-col items-center text-center">
                      <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Performance metrics visualization will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <QuickActions />
          </div>
        </div>
      );
  }
};

export default DashboardHome;
