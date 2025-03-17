import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import TransactionForm from "./TransactionForm";
import TransactionsList from "./TransactionsList";
import FinancialReports from "./FinancialReports";
import SalesAnalytics from "./SalesAnalytics";
import InvoiceForm from "./InvoiceForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, FileText, BarChart2, TrendingUp, Receipt } from "lucide-react";

interface AccountingDashboardProps {
  branchId?: string;
  userRole?: string;
}

const AccountingDashboard = ({
  branchId,
  userRole = "branch_manager",
}: AccountingDashboardProps) => {
  const [currentBranchId, setCurrentBranchId] = useState<string>(
    branchId || ""
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
      <h1 className="text-3xl font-bold tracking-tight mb-6">إدارة المالية</h1>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="transactions" className="flex items-center">
            <CreditCard className="h-4 w-4 ml-2" />
            المعاملات المالية
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <Receipt className="h-4 w-4 ml-2" />
            الفواتير
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <FileText className="h-4 w-4 ml-2" />
            التقارير المالية
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart2 className="h-4 w-4 ml-2" />
            تحليل المبيعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TransactionForm branchId={currentBranchId} />
            </div>
            <div className="lg:col-span-2">
              <TransactionsList branchId={currentBranchId} limit={10} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <InvoiceForm branchId={currentBranchId} />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinancialReports branchId={currentBranchId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SalesAnalytics branchId={currentBranchId} />
        </TabsContent>
      </Tabs>
