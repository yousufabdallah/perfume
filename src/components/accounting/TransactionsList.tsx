import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search, RefreshCw, Eye, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransactionsListProps {
  branchId?: string;
  limit?: number;
  showFilters?: boolean;
  transactionType?: string;
}

const TransactionsList = ({
  branchId,
  limit = 10,
  showFilters = true,
  transactionType,
}: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | undefined>(
    transactionType,
  );

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch || !showFilters) {
      fetchTransactions();
    }
  }, [selectedBranch, selectedType]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);

      // If no branch is selected and we have branches, select the first one
      if (!selectedBranch && data && data.length > 0 && !branchId) {
        setSelectedBranch(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("financial_transactions")
        .select(
          `*, branch:branches(*), created_by_user:users!financial_transactions_created_by_fkey(*)`,
        )
        .order("transaction_date", { ascending: false });

      if (selectedBranch) {
        query = query.eq("branch_id", selectedBranch);
      }

      if (selectedType) {
        query = query.eq("transaction_type", selectedType);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            بيع
          </Badge>
        );
      case "purchase":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            شراء
          </Badge>
        );
      case "expense":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            مصروفات
          </Badge>
        );
      case "income":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            إيرادات
          </Badge>
        );
      case "refund":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            استرجاع
          </Badge>
        );
      case "transfer":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-800">
            تحويل مخزون
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP", { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">المعاملات المالية</CardTitle>
        <CardDescription>سجل المعاملات المالية للفروع</CardDescription>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger>
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
              <div className="w-full md:w-64">
                <Select
                  value={selectedType || ""}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع المعاملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    <SelectItem value="sale">بيع</SelectItem>
                    <SelectItem value="purchase">شراء</SelectItem>
                    <SelectItem value="expense">مصروفات</SelectItem>
                    <SelectItem value="income">إيرادات</SelectItem>
                    <SelectItem value="refund">استرجاع</SelectItem>
                    <SelectItem value="transfer">تحويل مخزون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المرجع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      لا توجد معاملات متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.reference_number || "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.transaction_type)}
                      </TableCell>
                      <TableCell>
                        {transaction.branch?.name || "غير معروف"}
                      </TableCell>
                      <TableCell
                        className={`font-medium ${transaction.transaction_type === "expense" || transaction.transaction_type === "purchase" || transaction.transaction_type === "refund" ? "text-red-600" : "text-green-600"}`}
                      >
                        {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell>
                        <TransactionDetailsDialog
                          transaction={transaction}
                          formatDate={formatDate}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TransactionDetailsDialogProps {
  transaction: any;
  formatDate: (dateString: string) => string;
}

const TransactionDetailsDialog = ({
  transaction,
  formatDate,
}: TransactionDetailsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تفاصيل المعاملة المالية</DialogTitle>
          <DialogDescription>معلومات تفصيلية عن المعاملة</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <p className="text-sm font-medium">رقم المعاملة:</p>
            <p className="text-sm text-muted-foreground">{transaction.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium">رقم المرجع:</p>
            <p className="text-sm text-muted-foreground">
              {transaction.reference_number || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">التاريخ:</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(transaction.transaction_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">النوع:</p>
            <p className="text-sm text-muted-foreground">
              {transaction.transaction_type === "sale"
                ? "بيع"
                : transaction.transaction_type === "purchase"
                  ? "شراء"
                  : transaction.transaction_type === "expense"
                    ? "مصروفات"
                    : transaction.transaction_type === "income"
                      ? "إيرادات"
                      : transaction.transaction_type === "refund"
                        ? "استرجاع"
                        : transaction.transaction_type === "transfer"
                          ? "تحويل مخزون"
                          : transaction.transaction_type}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">الفرع:</p>
            <p className="text-sm text-muted-foreground">
              {transaction.branch?.name || "غير معروف"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">المبلغ:</p>
            <p
              className={`text-sm font-medium ${transaction.transaction_type === "expense" || transaction.transaction_type === "purchase" || transaction.transaction_type === "refund" ? "text-red-600" : "text-green-600"}`}
            >
              {transaction.amount.toFixed(2)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium">الوصف:</p>
            <p className="text-sm text-muted-foreground">
              {transaction.description || "-"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium">تم إنشاؤها بواسطة:</p>
            <p className="text-sm text-muted-foreground">
              {transaction.created_by_user?.full_name || "غير معروف"}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline">
            <FileText className="h-4 w-4 ml-2" />
            طباعة الإيصال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionsList;
