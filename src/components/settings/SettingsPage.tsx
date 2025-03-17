import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { User, Settings, Shield, Bell, Key } from "lucide-react";

interface SettingsPageProps {
  userRole?: string;
  user?: any;
}

const SettingsPage = ({
  userRole = "general_manager",
  user,
}: SettingsPageProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inventoryAlerts: true,
    financialReports: true,
    systemUpdates: false,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileData.fullName },
      });

      if (error) throw error;

      // Also update the users table
      const { error: dbError } = await supabase
        .from("users")
        .update({ full_name: profileData.fullName })
        .eq("id", user?.id);

      if (dbError) throw dbError;

      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم تحديث معلومات الملف الشخصي بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, you would save these settings to the database
      // For now, we'll just show a success message
      setTimeout(() => {
        toast({
          title: "تم تحديث الإعدادات",
          description: "تم تحديث إعدادات الإشعارات بنجاح",
        });
        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Only general managers can access all settings
  const canAccessAllSettings = userRole === "general_manager";

  return (
    <div className="w-full p-6 bg-slate-50">
      <h1 className="text-3xl font-bold tracking-tight mb-6">الإعدادات</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 ml-2" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Key className="h-4 w-4 ml-2" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 ml-2" />
            الإشعارات
          </TabsTrigger>
          {canAccessAllSettings && (
            <TabsTrigger value="system" className="flex items-center">
              <Settings className="h-4 w-4 ml-2" />
              إعدادات النظام
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card className="w-full bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">الملف الشخصي</CardTitle>
              <CardDescription>
                تعديل معلومات الملف الشخصي الخاص بك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" value={profileData.email} disabled />
                    <p className="text-sm text-muted-foreground">
                      لا يمكن تغيير البريد الإلكتروني
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="w-full bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">الأمان</CardTitle>
              <CardDescription>تغيير كلمة المرور الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="w-full bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">الإشعارات</CardTitle>
              <CardDescription>تخصيص إعدادات الإشعارات</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleNotificationSettingsUpdate}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">
                        إشعارات البريد الإلكتروني
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات عبر البريد الإلكتروني
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inventoryAlerts">تنبيهات المخزون</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي تنبيهات عند انخفاض مستوى المخزون
                      </p>
                    </div>
                    <Switch
                      id="inventoryAlerts"
                      checked={notificationSettings.inventoryAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          inventoryAlerts: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="financialReports">التقارير المالية</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات عند إنشاء تقارير مالية جديدة
                      </p>
                    </div>
                    <Switch
                      id="financialReports"
                      checked={notificationSettings.financialReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          financialReports: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="systemUpdates">تحديثات النظام</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات حول تحديثات وتغييرات النظام
                      </p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          systemUpdates: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {canAccessAllSettings && (
          <TabsContent value="system">
            <Card className="w-full bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  إعدادات النظام
                </CardTitle>
                <CardDescription>
                  إعدادات متقدمة للنظام (متاحة فقط للمدير العام)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>وضع الصيانة</Label>
                        <p className="text-sm text-muted-foreground">
                          تفعيل وضع الصيانة للنظام (سيتم منع جميع المستخدمين من
                          الدخول باستثناء المدير العام)
                        </p>
                      </div>
                      <Switch id="maintenanceMode" />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>النسخ الاحتياطي التلقائي</Label>
                        <p className="text-sm text-muted-foreground">
                          تفعيل النسخ الاحتياطي التلقائي للبيانات
                        </p>
                      </div>
                      <Switch id="autoBackup" defaultChecked />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>تنزيل نسخة احتياطية</Label>
                      <div>
                        <Button variant="outline">
                          تنزيل نسخة احتياطية للبيانات
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        تنزيل نسخة احتياطية كاملة من قاعدة البيانات
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>إعادة تعيين النظام</Label>
                      <div>
                        <Button variant="destructive">
                          إعادة تعيين النظام
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        إعادة تعيين النظام بالكامل وحذف جميع البيانات (لا يمكن
                        التراجع عن هذا الإجراء)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
