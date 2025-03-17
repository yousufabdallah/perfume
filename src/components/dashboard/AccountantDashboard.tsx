import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  FileText,
  BarChart2,
  TrendingUp,
  Receipt,
} from "lucide-react";
import TransactionsList from "../accounting/TransactionsList";
import FinancialReports from "../accounting/FinancialReports";
import SalesAnalytics from "../accounting/SalesAnalytics";

interface AccountantDashboardProps {
  branchId?: string;
}

const AccountantDashboard = ({ branchId }: AccountantDashboardProps) => {
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    pendingInvoices: 0,
    expenses: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [branchId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch recent transactions
      let query = supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(5);

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data: transactions, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactions || []);

      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaySalesData, error: todaySalesError } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("transaction_type", "sale")
        .gte("transaction_date", today.toISOString())
        .eq(branchId ? "branch_id" : "branch_id", branchId || "*");

      if (todaySalesError) throw todaySalesError;

      // Calculate month sales
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const { data: monthSalesData, error: monthSalesError } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("transaction_type", "sale")
        .gte("transaction_date", firstDayOfMonth.toISOString())
        .eq(branchId ? "branch_id" : "branch_id", branchId || "*");

      if (monthSalesError) throw monthSalesError;

      // Calculate expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("transaction_type", "expense")
        .gte("transaction_date", firstDayOfMonth.toISOString())
        .eq(branchId ? "branch_id" : "branch_id", branchId || "*");

      if (expensesError) throw expensesError;

      // Set stats
      setStats({
        todaySales:
          todaySalesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        monthSales:
          monthSalesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        pendingInvoices: 0, // This would come from invoices table
        expenses:
          expensesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          لوحة التحكم - المحاسب
        </h1>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todaySales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">+2.5% من أمس</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مبيعات الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +4.3% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              تحتاج إلى مراجعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.expenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions" className="flex items-center">
            <CreditCard className="h-4 w-4 ml-2" />
            آخر المعاملات
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

        <TabsContent value="transactions">
          <TransactionsList
            branchId={branchId}
            limit={10}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports branchId={branchId} />
        </TabsContent>

        <TabsContent value="analytics">
          <SalesAnalytics branchId={branchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountantDashboard;
