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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react";

interface UserManagementProps {
  userRole?: string;
}

const UserManagement = ({
  userRole = "general_manager",
}: UserManagementProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "accountant",
    branch_id: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, branch:branches(*)");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
      if (data && data.length > 0 && !formData.branch_id) {
        setFormData((prev) => ({ ...prev, branch_id: data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate general manager email
      if (
        formData.role === "general_manager" &&
        formData.email !== "yousufabdallah2000@gmail.com"
      ) {
        throw new Error(
          "Only yousufabdallah2000@gmail.com can be the general manager",
        );
      }

      // Check if a general manager already exists when trying to create one
      if (formData.role === "general_manager") {
        const { data: existingGM, error: gmError } = await supabase
          .from("users")
          .select("id")
          .eq("role", "general_manager");

        if (gmError) throw gmError;
        if (existingGM && existingGM.length > 0) {
          throw new Error("A general manager already exists");
        }
      }

      // Call the create_user_with_role function
      const { data, error } = await supabase.rpc("create_user_with_role", {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_role: formData.role,
        branch_id: formData.branch_id,
      });

      if (error) throw error;
      setAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(`Error: ${error.message || "Failed to add user"}`);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      // Use the update_user_with_role function to update the user
      const { data, error } = await supabase.rpc("update_user_with_role", {
        user_id: currentUser.id,
        full_name: formData.full_name,
        user_role: formData.role,
        branch_id: formData.branch_id,
      });

      if (error) throw error;
      setEditDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      alert(`Error: ${error.message || "Failed to update user"}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      // Use the delete_user function to delete the user
      const { data, error } = await supabase.rpc("delete_user", {
        user_id: currentUser.id,
      });

      if (error) throw error;
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(`Error: ${error.message || "Failed to delete user"}`);
    }
  };

  const openEditDialog = (user: any) => {
    setCurrentUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email,
      password: "", // We don't show or edit passwords
      role: user.role,
      branch_id: user.branch_id || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: any) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: "accountant",
      branch_id: branches.length > 0 ? branches[0].id : "",
    });
    setCurrentUser(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "general_manager":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            المدير العام
          </Badge>
        );
      case "branch_manager":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            مدير فرع
          </Badge>
        );
      case "accountant":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            محاسب
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Only general managers can access this component
  if (userRole !== "general_manager") {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">إدارة المستخدمين</CardTitle>
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
        <CardTitle className="text-xl font-bold">إدارة المستخدمين</CardTitle>
        <CardDescription>إضافة وتعديل وحذف المستخدمين</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن مستخدم..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات المستخدم الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="full_name"
                        className="text-right col-span-1"
                      >
                        الاسم الكامل
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right col-span-1">
                        البريد الإلكتروني
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="password"
                        className="text-right col-span-1"
                      >
                        كلمة المرور
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right col-span-1">
                        الدور
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          handleSelectChange("role", value)
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general_manager">
                            المدير العام
                          </SelectItem>
                          <SelectItem value="branch_manager">
                            مدير فرع
                          </SelectItem>
                          <SelectItem value="accountant">محاسب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="branch" className="text-right col-span-1">
                        الفرع
                      </Label>
                      <Select
                        value={formData.branch_id}
                        onValueChange={(value) =>
                          handleSelectChange("branch_id", value)
                        }
                      >
                        <SelectTrigger className="col-span-3">
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
                  </div>
                  <DialogFooter>
                    <Button type="submit">إضافة المستخدم</Button>
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
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      لا يوجد مستخدمين متاحين
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "-"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.branch?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
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
              <DialogTitle>تعديل المستخدم</DialogTitle>
              <DialogDescription>
                تعديل معلومات المستخدم{" "}
                {currentUser?.full_name || currentUser?.email}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-full_name"
                    className="text-right col-span-1"
                  >
                    الاسم الكامل
                  </Label>
                  <Input
                    id="edit-full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right col-span-1">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="edit-email"
                    value={formData.email}
                    className="col-span-3"
                    disabled
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right col-span-1">
                    الدور
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_manager">
                        المدير العام
                      </SelectItem>
                      <SelectItem value="branch_manager">مدير فرع</SelectItem>
                      <SelectItem value="accountant">محاسب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-branch"
                    className="text-right col-span-1"
                  >
                    الفرع
                  </Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) =>
                      handleSelectChange("branch_id", value)
                    }
                  >
                    <SelectTrigger className="col-span-3">
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
              <DialogTitle>حذف المستخدم</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من رغبتك في حذف المستخدم{" "}
                {currentUser?.full_name || currentUser?.email}؟
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
              <Button variant="destructive" onClick={handleDeleteUser}>
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
