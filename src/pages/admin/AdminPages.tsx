import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  FileText,
  Globe,
  Search,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Page = Tables<'pages'>;

interface PageFormData {
  slug: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  is_published: boolean;
}

const emptyFormData: PageFormData = {
  slug: '',
  title: '',
  title_ar: '',
  content: '',
  content_ar: '',
  is_published: false,
};

const AdminPages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<PageFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await fetchPages();
    };

    if (!authLoading) {
      checkAdminAndFetch();
    }
  }, [user, authLoading, navigate]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('حدث خطأ في جلب الصفحات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPage(null);
    setFormData(emptyFormData);
    setEditDialogOpen(true);
  };

  const handleEdit = (page: Page) => {
    setSelectedPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      title_ar: page.title_ar || '',
      content: page.content || '',
      content_ar: page.content_ar || '',
      is_published: page.is_published,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (page: Page) => {
    setSelectedPage(page);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPage) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', selectedPage.id);

      if (error) throw error;

      toast.success('تم حذف الصفحة بنجاح');
      await fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('حدث خطأ أثناء حذف الصفحة');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPage(null);
    }
  };

  const handleSave = async () => {
    if (!formData.slug.trim() || !formData.title.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط');
      return;
    }

    setSaving(true);
    try {
      if (selectedPage) {
        // Update existing page
        const { error } = await supabase
          .from('pages')
          .update({
            slug: formData.slug,
            title: formData.title,
            title_ar: formData.title_ar || null,
            content: formData.content || null,
            content_ar: formData.content_ar || null,
            is_published: formData.is_published,
          })
          .eq('id', selectedPage.id);

        if (error) throw error;
        toast.success('تم تحديث الصفحة بنجاح');
      } else {
        // Create new page
        const maxOrder = pages.length > 0
          ? Math.max(...pages.map((p) => p.order_index))
          : -1;

        const { error } = await supabase.from('pages').insert({
          slug: formData.slug,
          title: formData.title,
          title_ar: formData.title_ar || null,
          content: formData.content || null,
          content_ar: formData.content_ar || null,
          is_published: formData.is_published,
          order_index: maxOrder + 1,
        });

        if (error) {
          if (error.code === '23505') {
            toast.error('هذا الرابط مستخدم بالفعل');
            return;
          }
          throw error;
        }
        toast.success('تم إنشاء الصفحة بنجاح');
      }

      setEditDialogOpen(false);
      await fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('حدث خطأ أثناء حفظ الصفحة');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      toast.success(page.is_published ? 'تم إلغاء نشر الصفحة' : 'تم نشر الصفحة');
      await fetchPages();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('حدث خطأ');
    }
  };

  const handleReorder = async (newOrder: Page[]) => {
    setPages(newOrder);

    // Update order in database
    try {
      await Promise.all(
        newOrder.map((page, index) =>
          supabase
            .from('pages')
            .update({ order_index: index })
            .eq('id', page.id)
        )
      );
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('حدث خطأ في إعادة الترتيب');
      await fetchPages();
    }
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.title_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">إدارة الصفحات</h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وتعديل صفحات الموقع
            </p>
          </div>
          <Button className="btn-gold" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 ml-2" />
            صفحة جديدة
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الصفحات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Pages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              الصفحات ({filteredPages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد صفحات</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإنشاء صفحة جديدة
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء صفحة
                </Button>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={filteredPages}
                onReorder={handleReorder}
                className="space-y-2"
              >
                <AnimatePresence>
                  {filteredPages.map((page) => (
                    <Reorder.Item
                      key={page.id}
                      value={page}
                      className="bg-muted/50 rounded-lg p-4 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {page.title_ar || page.title}
                            </h3>
                            <Badge
                              variant={page.is_published ? 'default' : 'secondary'}
                              className={page.is_published ? 'bg-green-500' : ''}
                            >
                              {page.is_published ? 'منشورة' : 'مسودة'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            /page/{page.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish(page)}
                            title={page.is_published ? 'إلغاء النشر' : 'نشر'}
                          >
                            {page.is_published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          {page.is_published && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                              title="عرض الصفحة"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(page)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(page)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPage ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Slug */}
            <div className="space-y-2">
              <Label>رابط الصفحة (Slug) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/page/</span>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="my-page"
                  dir="ltr"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط
              </p>
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>نشر الصفحة</Label>
                <p className="text-sm text-muted-foreground">
                  الصفحات المنشورة تكون مرئية للجميع
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="arabic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="arabic">العربية</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>

              <TabsContent value="arabic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عنوان الصفحة (عربي)</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, title_ar: e.target.value })
                    }
                    placeholder="عنوان الصفحة بالعربية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>محتوى الصفحة (عربي)</Label>
                  <Textarea
                    value={formData.content_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, content_ar: e.target.value })
                    }
                    placeholder="اكتب محتوى الصفحة هنا..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    يمكنك استخدام Markdown للتنسيق
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="english" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Page Title (English) *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Page title in English"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Content (English)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Write page content here..."
                    className="min-h-[200px]"
                    dir="ltr"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="btn-gold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : selectedPage ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الصفحة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف صفحة "{selectedPage?.title_ar || selectedPage?.title}"؟
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPages;
