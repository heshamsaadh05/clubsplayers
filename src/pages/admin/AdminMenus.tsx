import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, Menu, FileText } from "lucide-react";
import { useAllMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, MenuItem, MenuItemInsert } from "@/hooks/useMenuItems";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublishedPages } from "@/hooks/usePublishedPages";

const AdminMenus = () => {
  const { t, currentLanguage } = useLanguage();
  const { data: menuItems = [], isLoading } = useAllMenuItems();
  const { pages: publishedPages = [], loading: pagesLoading } = usePublishedPages();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemInsert>({
    title: '',
    title_ar: '',
    url: '',
    location: 'header',
    is_external: false,
    order_index: 0,
    is_active: true,
    parent_id: null,
  });

  const headerItems = menuItems.filter(item => item.location === 'header' || item.location === 'both');
  const footerItems = menuItems.filter(item => item.location === 'footer' || item.location === 'both');

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        title_ar: item.title_ar || '',
        url: item.url,
        location: item.location,
        is_external: item.is_external,
        order_index: item.order_index,
        is_active: item.is_active,
        parent_id: item.parent_id,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        title_ar: '',
        url: '',
        location: 'header',
        is_external: false,
        order_index: menuItems.length + 1,
        is_active: true,
        parent_id: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      await updateMenuItem.mutateAsync({
        id: editingItem.id,
        updates: formData,
      });
    } else {
      await createMenuItem.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      await deleteMenuItem.mutateAsync(id);
    }
  };

  const handleToggleActive = async (item: MenuItem) => {
    await updateMenuItem.mutateAsync({
      id: item.id,
      updates: { is_active: !item.is_active },
    });
  };

  const renderMenuTable = (items: MenuItem[], location: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>العنوان (EN)</TableHead>
          <TableHead>العنوان (AR)</TableHead>
          <TableHead>الرابط</TableHead>
          <TableHead>الموقع</TableHead>
          <TableHead>خارجي</TableHead>
          <TableHead>نشط</TableHead>
          <TableHead className="text-left">إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              لا توجد عناصر في القائمة
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.title_ar || '-'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                <span className="flex items-center gap-1">
                  {item.url}
                  {item.is_external && <ExternalLink className="w-3 h-3" />}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.location === 'header' ? 'bg-blue-500/20 text-blue-400' :
                  item.location === 'footer' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {item.location === 'header' ? 'الهيدر' : 
                   item.location === 'footer' ? 'الفوتر' : 'كلاهما'}
                </span>
              </TableCell>
              <TableCell>
                {item.is_external ? (
                  <span className="text-gold">نعم</span>
                ) : (
                  <span className="text-muted-foreground">لا</span>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={() => handleToggleActive(item)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة القوائم</h1>
            <p className="text-muted-foreground mt-1">
              تحكم في عناصر القوائم في الهيدر والفوتر
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة عنصر جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'تعديل عنصر القائمة' : 'إضافة عنصر جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">العنوان (EN)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Home"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_ar">العنوان (AR)</Label>
                    <Input
                      id="title_ar"
                      value={formData.title_ar || ''}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="الرئيسية"
                      dir="rtl"
                    />
                  </div>
                </div>
                
                {/* Page Selection */}
                {publishedPages.length > 0 && (
                  <div className="space-y-2">
                    <Label>اختر من الصفحات المنشورة</Label>
                    <Select
                      value=""
                      onValueChange={(pageId) => {
                        const selectedPage = publishedPages.find(p => p.id === pageId);
                        if (selectedPage) {
                          setFormData({
                            ...formData,
                            title: selectedPage.title,
                            title_ar: selectedPage.title_ar || '',
                            url: `/page/${selectedPage.slug}`,
                            is_external: false,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر صفحة لتعبئة البيانات تلقائياً..." />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {page.title_ar || page.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      اختر صفحة لتعبئة العنوان والرابط تلقائياً
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="url">الرابط</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="#home أو /page/about"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">الموقع</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value: 'header' | 'footer' | 'both') => 
                        setFormData({ ...formData, location: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">الهيدر</SelectItem>
                        <SelectItem value="footer">الفوتر</SelectItem>
                        <SelectItem value="both">كلاهما</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_index">الترتيب</Label>
                    <Input
                      id="order_index"
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_external"
                      checked={formData.is_external}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_external: checked })}
                    />
                    <Label htmlFor="is_external">رابط خارجي</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">نشط</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 btn-gold">
                    {editingItem ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="header" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="header" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              قائمة الهيدر ({headerItems.length})
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              قائمة الفوتر ({footerItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="header">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="w-5 h-5" />
                  عناصر الهيدر
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : (
                  renderMenuTable(headerItems, 'header')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="w-5 h-5" />
                  عناصر الفوتر
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : (
                  renderMenuTable(footerItems, 'footer')
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenus;
