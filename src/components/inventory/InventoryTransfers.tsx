import React, { useState, useEffect } from "react";
import { supabase, InventoryTransfer, Branch, User } from "@/lib/supabase";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

interface InventoryTransfersProps {
  branchId?: string;
  userRole?: string;
}

const InventoryTransfers = ({
  branchId,
  userRole = "branch_manager",
}: InventoryTransfersProps) => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [userBranchId, setUserBranchId] = useState<string | null>(
    branchId || null,
  );

  useEffect(() => {
    // If branchId is provided, use it; otherwise fetch user's branch
    if (branchId) {
      setUserBranchId(branchId);
    } else if (user) {
      fetchUserBranch();
    }
  }, [branchId, user]);

  const fetchUserBranch = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("branch_id")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setUserBranchId(data?.branch_id || null);
    } catch (error) {
      console.error("Error fetching user branch:", error);
    }
  };

  useEffect(() => {
    if (userBranchId) {
      fetchTransfers();
    }
  }, [userBranchId, activeTab]);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("inventory_transfers")
        .select(
          `*, 
          from_branch:branches!inventory_transfers_from_branch_id_fkey(*), 
          to_branch:branches!inventory_transfers_to_branch_id_fkey(*), 
          requested_by_user:users!inventory_transfers_requested_by_fkey(*), 
          approved_by_user:users!inventory_transfers_approved_by_fkey(*)`,
        )
        .order("request_date", { ascending: false });

      if (activeTab === "incoming") {
        query = query.eq("to_branch_id", userBranchId);
      } else {
        query = query.eq("from_branch_id", userBranchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            قيد الانتظار
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            تمت الموافقة
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            مكتمل
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            مرفوض
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP", { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">طلبات نقل المخزون</CardTitle>
        <CardDescription>إدارة طلبات نقل المخزون بين الفروع</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="incoming">الطلبات الواردة</TabsTrigger>
            <TabsTrigger value="outgoing">الطلبات الصادرة</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {renderTransfersTable(
              transfers,
              isLoading,
              getStatusBadge,
              formatDate,
              userRole,
              fetchTransfers,
              "incoming",
              user?.id,
            )}
          </TabsContent>

          <TabsContent value="outgoing">
            {renderTransfersTable(
              transfers,
              isLoading,
              getStatusBadge,
              formatDate,
              userRole,
              fetchTransfers,
              "outgoing",
              user?.id,
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const renderTransfersTable = (
  transfers: any[],
  isLoading: boolean,
  getStatusBadge: (status: string) => React.ReactNode,
  formatDate: (dateString: string) => string,
  userRole: string,
  onRefresh: () => void,
  type: "incoming" | "outgoing",
  userId?: string,
) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-8">
        <p>لا توجد طلبات نقل {type === "incoming" ? "واردة" : "صادرة"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === "incoming" ? "من فرع" : "إلى فرع"}</TableHead>
            <TableHead>تاريخ الطلب</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>طلب بواسطة</TableHead>
            <TableHead>تمت الموافقة بواسطة</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell>
                {type === "incoming"
                  ? transfer.from_branch?.name || "غير معروف"
                  : transfer.to_branch?.name || "غير معروف"}
              </TableCell>
              <TableCell>{formatDate(transfer.request_date)}</TableCell>
              <TableCell>{getStatusBadge(transfer.status)}</TableCell>
              <TableCell>
                {transfer.requested_by_user?.full_name || "غير معروف"}
              </TableCell>
              <TableCell>
                {transfer.approved_by_user?.full_name || "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <TransferDetailsDialog
                    transfer={transfer}
                    formatDate={formatDate}
                  />
                  {type === "incoming" &&
                    transfer.status === "pending" &&
                    userRole === "branch_manager" && (
                      <>
                        <ApproveTransferButton
                          transferId={transfer.id}
                          userId={userId}
                          onSuccess={onRefresh}
                        />
                        <RejectTransferButton
                          transferId={transfer.id}
                          userId={userId}
                          onSuccess={onRefresh}
                        />
                      </>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface TransferDetailsDialogProps {
  transfer: any;
  formatDate: (dateString: string) => string;
}

const TransferDetailsDialog = ({
  transfer,
  formatDate,
}: TransferDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTransferItems();
    }
  }, [open]);

  const fetchTransferItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory_transfer_items")
        .select("*, product:products(*)")
        .eq("transfer_id", transfer.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching transfer items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تفاصيل طلب نقل المخزون</DialogTitle>
          <DialogDescription>
            طلب من {transfer.from_branch?.name || "غير معروف"} إلى{" "}
            {transfer.to_branch?.name || "غير معروف"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <p className="text-sm font-medium">رقم الطلب:</p>
            <p className="text-sm text-muted-foreground">{transfer.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium">الحالة:</p>
            <p className="text-sm text-muted-foreground">
              {transfer.status === "pending"
                ? "قيد الانتظار"
                : transfer.status === "approved"
                  ? "تمت الموافقة"
                  : transfer.status === "completed"
                    ? "مكتمل"
                    : transfer.status === "rejected"
                      ? "مرفوض"
                      : transfer.status}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">تاريخ الطلب:</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(transfer.request_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">تاريخ الإكمال:</p>
            <p className="text-sm text-muted-foreground">
              {transfer.completion_date
                ? formatDate(transfer.completion_date)
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">طلب بواسطة:</p>
            <p className="text-sm text-muted-foreground">
              {transfer.requested_by_user?.full_name || "غير معروف"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">تمت الموافقة بواسطة:</p>
            <p className="text-sm text-muted-foreground">
              {transfer.approved_by_user?.full_name || "-"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">المنتجات المطلوبة:</h4>
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد منتجات</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || "غير معروف"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.product?.price
                          ? item.product.price.toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.product?.price
                          ? (item.product.price * item.quantity).toFixed(2)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {transfer.notes && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">ملاحظات:</h4>
            <p className="text-sm text-muted-foreground">{transfer.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ApproveTransferButtonProps {
  transferId: string;
  userId?: string;
  onSuccess: () => void;
}

const ApproveTransferButton = ({
  transferId,
  userId,
  onSuccess,
}: ApproveTransferButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("inventory_transfers")
        .update({
          status: "approved",
          approved_by: userId || "00000000-0000-0000-0000-000000000000",
        })
        .eq("id", transferId);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error("Error approving transfer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleApprove}
      disabled={isLoading}
      className="bg-green-50 hover:bg-green-100 text-green-600"
    >
      <CheckCircle className="h-4 w-4" />
    </Button>
  );
};

interface RejectTransferButtonProps {
  transferId: string;
  userId?: string;
  onSuccess: () => void;
}

const RejectTransferButton = ({
  transferId,
  userId,
  onSuccess,
}: RejectTransferButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("inventory_transfers")
        .update({
          status: "rejected",
          approved_by: userId || "00000000-0000-0000-0000-000000000000",
        })
        .eq("id", transferId);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error("Error rejecting transfer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleReject}
      disabled={isLoading}
      className="bg-red-50 hover:bg-red-100 text-red-600"
    >
      <XCircle className="h-4 w-4" />
    </Button>
  );
};

export default InventoryTransfers;
