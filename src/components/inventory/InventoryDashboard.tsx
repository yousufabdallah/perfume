import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductManagement from "./ProductManagement";
import InventoryTransfers from "./InventoryTransfers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, RefreshCw, TrendingUp } from "lucide-react";

interface InventoryDashboardProps {
  branchId?: string;
  userRole?: string;
}

const InventoryDashboard = ({
  branchId,
  userRole = "branch_manager",
}: InventoryDashboardProps) => {
  const [currentBranchId, setCurrentBranchId] = useState<string>(
    branchId || "",
  );

  useEffect(() => {
    if (!branchId) {
      // If no branchId is provided, fetch the user's branch
      fetchUserBranch();
    } else {
      setCurrentBranchId(branchId);
    }
  }, [branchId]);

  const fetchUserBranch = async () => {
    try {
      // In a real app, you would get the current user's ID from auth
      // For now, we'll just get the first branch
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) setCurrentBranchId(data.id);
    } catch (error) {
      console.error("Error fetching user branch:", error);
    }
  };

  if (!currentBranchId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-slate-50">
      <h1 className="text-3xl font-bold tracking-tight mb-6">إدارة المخزون</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="products" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            المنتجات والمخزون
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            طلبات نقل المخزون
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            تحليلات المخزون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductManagement branchId={currentBranchId} />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <InventoryTransfers branchId={currentBranchId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-white p-8 rounded-lg border text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">تحليلات المخزون</h2>
            <p className="text-muted-foreground">
              سيتم إضافة تحليلات المخزون قريبًا
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryDashboard;
