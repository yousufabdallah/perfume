import React, { useState, useEffect } from "react";
import { supabase, Branch } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileDown, BarChart3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FinancialReportsProps {
  branchId?: string;
}

interface ReportData {
  sales: number;
  purchases: number;
  expenses: number;
  income: number;
  refunds: number;
  profit: number;
}

const FinancialReports = ({ branchId }: FinancialReportsProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [reportType, setReportType] = useState<string>("monthly");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [transactionsByType, setTransactionsByType] = useState<any[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (reportType === "monthly") {
      setStartDate(startOfMonth(new Date()));
      setEndDate(endOfMonth(new Date()));
    } else if (reportType === "quarterly") {
      setStartDate(startOfMonth(subMonths(new Date(), 2)));
      setEndDate(endOfMonth(new Date()));
    } else if (reportType === "yearly") {
      setStartDate(startOfMonth(subMonths(new Date(), 11)));
      setEndDate(endOfMonth(new Date()));
    }
  }, [reportType]);

  useEffect(() => {
    if (selectedBranch) {
      generateReport();
    }
  }, [selectedBranch, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Fetch all transactions for the selected period and branch
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("branch_id", selectedBranch)
        .gte("transaction_date", startDate.toISOString())
        .lte("transaction_date", endDate.toISOString())
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      // Calculate totals by transaction type
      const sales = data
        .filter((t) => t.transaction_type === "sale")
        .reduce((sum, t) => sum + t.amount, 0);

      const purchases = data
        .filter((t) => t.transaction_type === "purchase")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = data
        .filter((t) => t.transaction_type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const income = data
        .filter((t) => t.transaction_type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const refunds = data
        .filter((t) => t.transaction_type === "refund")
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate profit
      const profit = sales + income - purchases - expenses - refunds;

      setReportData({
        sales,
        purchases,
        expenses,
        income,
        refunds,
        profit,
      });

      // Group transactions by type for the summary
      const typeGroups = [
        { type: "sale", label: "المبيعات", amount: sales },
        { type: "purchase", label: "المشتريات", amount: purchases },
        { type: "expense", label: "المصروفات", amount: expenses },
        { type: "income", label: "الإيرادات", amount: income },
        { type: "refund", label: "المرتجعات", amount: refunds },
      ];

      setTransactionsByType(typeGroups);

      // Group transactions by date for daily breakdown
      const dailyGroups: { [key: string]: { date: string; amount: number } } =
        {};

      data.forEach((transaction) => {
        const date = transaction.transaction_date.split("T")[0];
        if (!dailyGroups[date]) {
          dailyGroups[date] = { date, amount: 0 };
        }

        // Add or subtract based on transaction type
        if (
          transaction.transaction_type === "sale" ||
          transaction.transaction_type === "income"
        ) {
          dailyGroups[date].amount += transaction.amount;
        } else {
          dailyGroups[date].amount -= transaction.amount;
        }
      });

      setDailyTransactions(
        Object.values(dailyGroups).sort((a, b) => a.date.localeCompare(b.date)),
      );
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP", { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const branch = branches.find((b) => b.id === selectedBranch);
    const reportTitle = `التقرير المالي - ${branch?.name || "الفرع"} - ${formatDate(
      startDate.toISOString(),
    )} إلى ${formatDate(endDate.toISOString())}`;

    const csvContent = [
      reportTitle,
      "",
      "نوع المعاملة,المبلغ",
      `المبيعات,${reportData.sales.toFixed(2)}`,
      `المشتريات,${reportData.purchases.toFixed(2)}`,
      `المصروفات,${reportData.expenses.toFixed(2)}`,
      `الإيرادات,${reportData.income.toFixed(2)}`,
      `المرتجعات,${reportData.refunds.toFixed(2)}`,
      `صافي الربح,${reportData.profit.toFixed(2)}`,
      "",
      "التفاصيل اليومية",
      "التاريخ,المبلغ",
      ...dailyTransactions.map(
        (day) => `${formatDate(day.date)},${day.amount.toFixed(2)}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `financial_report_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">التقارير المالية</CardTitle>
        <CardDescription>
          عرض وتحليل البيانات المالية للفترة المحددة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch">الفرع</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger id="branch">
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">نوع التقرير</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="اختر نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="quarterly">ربع سنوي</SelectItem>
                <SelectItem value="yearly">سنوي</SelectItem>
                <SelectItem value="custom">مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">من تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="startDate"
                  variant={"outline"}
                  className={"w-full justify-start text-right font-normal"}
                  disabled={reportType !== "custom"}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP", { locale: ar })
                  ) : (
                    <span>اختر تاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  disabled={reportType !== "custom"}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">إلى تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant={"outline"}
                  className={"w-full justify-start text-right font-normal"}
                  disabled={reportType !== "custom"}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP", { locale: ar })
                  ) : (
                    <span>اختر تاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  disabled={reportType !== "custom"}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">جاري تحميل التقرير...</p>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">إجمالي المبيعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.sales.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">إجمالي المصروفات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {(reportData.expenses + reportData.purchases).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">صافي الربح</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${reportData.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {reportData.profit.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ملخص المعاملات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نوع المعاملة</TableHead>
                        <TableHead>المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsByType.map((item) => (
                        <TableRow key={item.type}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell
                            className={`font-medium ${item.type === "sale" || item.type === "income" ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">صافي الربح</TableCell>
                        <TableCell
                          className={`font-bold ${reportData.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {reportData.profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">التفاصيل اليومية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center h-24">
                              لا توجد بيانات متاحة
                            </TableCell>
                          </TableRow>
                        ) : (
                          dailyTransactions.map((day, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatDate(day.date)}</TableCell>
                              <TableCell
                                className={`font-medium ${day.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {day.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              اختر الفرع والفترة الزمنية لعرض التقرير المالي
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={exportReport}
          disabled={!reportData || isLoading}
          className="ml-auto"
        >
          <FileDown className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FinancialReports;
