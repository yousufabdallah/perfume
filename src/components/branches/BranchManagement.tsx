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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react";

interface BranchManagementProps {
  userRole?: string;
}

const BranchManagement = ({
  userRole = "general_manager",
}: BranchManagementProps) => {
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      // Use direct SQL query to bypass any potential RLS issues
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching branches:", error);
        alert(`فشل جلب الفروع: ${error.message}`);
        setBranches([]);
      } else {
        setBranches(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      alert(`فشل جلب الفروع: ${error.message || "خطأ غير معروف"}`);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Direct SQL query approach to bypass RLS completely
      const { data, error } = await supabase.rpc("insert_branch", {
        branch_name: formData.name,
        branch_address: formData.address || null,
        branch_phone: formData.phone || null,
      });

      if (error) {
        console.error("Error adding branch:", error);
        alert(`فشل إضافة الفرع: ${error.message}`);
        return;
      }

      setAddDialogOpen(false);
      resetForm();
      fetchBranches();
    } catch (error: any) {
      console.error("Error adding branch:", error);
      alert(`فشل إضافة الفرع: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    try {
      // Use the RPC function to update branch
      const { error } = await supabase.rpc("update_branch", {
        branch_id: currentBranch.id,
        branch_name: formData.name,
        branch_address: formData.address || null,
        branch_phone: formData.phone || null,
      });

      if (error) {
        console.error("Error updating branch:", error);
        alert(`فشل تحديث الفرع: ${error.message}`);
        return;
      }

      setEditDialogOpen(false);
      resetForm();
      fetchBranches();
    } catch (error: any) {
      console.error("Error updating branch:", error);
      alert(`فشل تحديث الفرع: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const handleDeleteBranch = async () => {
    if (!currentBranch) return;

    try {
      // Use the RPC function to delete branch
      const { error } = await supabase.rpc("delete_branch", {
        branch_id: currentBranch.id,
      });

      if (error) {
        console.error("Error deleting branch:", error);
        alert(`فشل حذف الفرع: ${error.message}`);
        return;
      }

      setDeleteDialogOpen(false);
      fetchBranches();
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      alert(`فشل حذف الفرع: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const openEditDialog = (branch: any) => {
    setCurrentBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (branch: any) => {
    setCurrentBranch(branch);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
    });
    setCurrentBranch(null);
  };

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Only general managers can access this component
  if (userRole !== "general_manager") {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">إدارة الفروع</CardTitle>
          <CardDescription>
            ليس لديك صلاحية للوصول إلى هذه الصفحة
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">إدارة الفروع</CardTitle>
        <CardDescription>إضافة وتعديل وحذف فروع الشركة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن فرع..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBranches}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فرع
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة فرع جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات الفرع الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddBranch}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right col-span-1">
                        اسم الفرع
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="address"
                        className="text-right col-span-1"
                      >
                        العنوان
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right col-span-1">
                        رقم الهاتف
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">إضافة الفرع</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      لا توجد فروع متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        {branch.name}
                      </TableCell>
                      <TableCell>{branch.address || "-"}</TableCell>
                      <TableCell>{branch.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(branch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(branch)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تعديل الفرع</DialogTitle>
              <DialogDescription>
                تعديل معلومات الفرع {currentBranch?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditBranch}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right col-span-1">
                    اسم الفرع
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-address"
                    className="text-right col-span-1"
                  >
                    العنوان
                  </Label>
                  <Input
                    id="edit-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-phone" className="text-right col-span-1">
                    رقم الهاتف
                  </Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>حذف الفرع</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من رغبتك في حذف الفرع {currentBranch?.name}؟
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleDeleteBranch}>
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BranchManagement;
