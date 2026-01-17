import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Globe, Check, X, GripVertical, Languages } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  is_active: boolean;
  is_default: boolean;
  order_index: number;
}

interface Translation {
  id: string;
  language_code: string;
  key: string;
  value: string;
  category: string;
}

const TRANSLATION_CATEGORIES = [
  { id: 'general', label: 'عام' },
  { id: 'nav', label: 'القائمة' },
  { id: 'auth', label: 'التسجيل والدخول' },
  { id: 'player', label: 'اللاعبين' },
  { id: 'club', label: 'الأندية' },
  { id: 'subscription', label: 'الاشتراكات' },
  { id: 'common', label: 'مشترك' },
];

const AdminLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [translationsDialogOpen, setTranslationsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr' as 'ltr' | 'rtl',
    is_active: true,
    is_default: false,
  });
  const [translationForm, setTranslationForm] = useState({
    key: '',
    value: '',
    category: 'general',
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLanguages((data || []) as Language[]);
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error('حدث خطأ في جلب اللغات');
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslations = async (langCode: string) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', langCode)
        .order('category', { ascending: true });

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error('حدث خطأ في جلب الترجمات');
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.native_name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (selectedLanguage) {
        // Update existing
        const { error } = await supabase
          .from('languages')
          .update({
            code: formData.code,
            name: formData.name,
            native_name: formData.native_name,
            direction: formData.direction,
            is_active: formData.is_active,
            is_default: formData.is_default,
          })
          .eq('id', selectedLanguage.id);

        if (error) throw error;
        toast.success('تم تحديث اللغة بنجاح');
      } else {
        // Create new
        const maxOrder = Math.max(...languages.map(l => l.order_index), 0);
        const { error } = await supabase
          .from('languages')
          .insert({
            code: formData.code,
            name: formData.name,
            native_name: formData.native_name,
            direction: formData.direction,
            is_active: formData.is_active,
            is_default: formData.is_default,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('تم إضافة اللغة بنجاح');
      }

      // If this language is set as default, unset others
      if (formData.is_default) {
        await supabase
          .from('languages')
          .update({ is_default: false })
          .neq('code', formData.code);
      }

      resetForm();
      fetchLanguages();
    } catch (error: any) {
      console.error('Error saving language:', error);
      toast.error(error.message || 'حدث خطأ في حفظ اللغة');
    }
  };

  const handleDelete = async () => {
    if (!selectedLanguage) return;

    if (selectedLanguage.is_default) {
      toast.error('لا يمكن حذف اللغة الافتراضية');
      return;
    }

    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', selectedLanguage.id);

      if (error) throw error;

      toast.success('تم حذف اللغة بنجاح');
      setDeleteDialogOpen(false);
      setSelectedLanguage(null);
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error('حدث خطأ في حذف اللغة');
    }
  };

  const handleAddTranslation = async () => {
    if (!selectedLanguage || !translationForm.key || !translationForm.value) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const { error } = await supabase
        .from('translations')
        .upsert({
          language_code: selectedLanguage.code,
          key: translationForm.key,
          value: translationForm.value,
          category: translationForm.category,
        }, { onConflict: 'language_code,key' });

      if (error) throw error;

      toast.success('تم حفظ الترجمة بنجاح');
      setTranslationForm({ key: '', value: '', category: 'general' });
      fetchTranslations(selectedLanguage.code);
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('حدث خطأ في حفظ الترجمة');
    }
  };

  const handleDeleteTranslation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الترجمة');
      if (selectedLanguage) {
        fetchTranslations(selectedLanguage.code);
      }
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast.error('حدث خطأ في حذف الترجمة');
    }
  };

  const openEditDialog = (language: Language) => {
    setSelectedLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      native_name: language.native_name,
      direction: language.direction,
      is_active: language.is_active,
      is_default: language.is_default,
    });
    setDialogOpen(true);
  };

  const openTranslationsDialog = (language: Language) => {
    setSelectedLanguage(language);
    fetchTranslations(language.code);
    setTranslationsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      native_name: '',
      direction: 'ltr',
      is_active: true,
      is_default: false,
    });
    setSelectedLanguage(null);
    setDialogOpen(false);
  };

  const filteredTranslations = selectedCategory === 'all' 
    ? translations 
    : translations.filter(t => t.category === selectedCategory);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">إدارة اللغات</h1>
            <p className="text-muted-foreground">إضافة وتعديل وحذف اللغات المتاحة في الموقع</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="btn-gold">
            <Plus className="w-4 h-4 ml-2" />
            إضافة لغة جديدة
          </Button>
        </div>

        {/* Languages Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {languages.map((language) => (
              <Card key={language.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{language.native_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{language.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {language.is_default && (
                        <Badge className="bg-gold text-gold-foreground text-xs">افتراضية</Badge>
                      )}
                      <Badge variant={language.is_active ? 'default' : 'secondary'} className="text-xs">
                        {language.is_active ? 'نشطة' : 'معطلة'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>الكود: {language.code}</span>
                    <span>الاتجاه: {language.direction === 'rtl' ? 'يمين لليسار' : 'يسار لليمين'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openTranslationsDialog(language)}
                    >
                      <Languages className="w-4 h-4 ml-1" />
                      الترجمات
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(language)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLanguage(language);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={language.is_default}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Language Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selectedLanguage ? 'تعديل اللغة' : 'إضافة لغة جديدة'}
              </DialogTitle>
              <DialogDescription>
                أدخل بيانات اللغة أدناه
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">كود اللغة *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="ar"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direction">الاتجاه</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value: 'ltr' | 'rtl') => setFormData({ ...formData, direction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtl">يمين لليسار (RTL)</SelectItem>
                      <SelectItem value="ltr">يسار لليمين (LTR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">اسم اللغة (بالإنجليزية) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Arabic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="native_name">اسم اللغة (بلغتها الأصلية) *</Label>
                <Input
                  id="native_name"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  placeholder="العربية"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">تفعيل اللغة</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">اللغة الافتراضية</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} className="btn-gold">
                {selectedLanguage ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Translations Dialog */}
        <Dialog open={translationsDialogOpen} onOpenChange={setTranslationsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-gold" />
                ترجمات {selectedLanguage?.native_name}
              </DialogTitle>
              <DialogDescription>
                إضافة وتعديل الترجمات لهذه اللغة
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="list" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">الترجمات الحالية</TabsTrigger>
                <TabsTrigger value="add">إضافة ترجمة</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="فلترة حسب الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      {TRANSLATION_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    {filteredTranslations.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        لا توجد ترجمات في هذه الفئة
                      </p>
                    ) : (
                      filteredTranslations.map((translation) => (
                        <div
                          key={translation.id}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {translation.category}
                              </Badge>
                              <code className="text-xs bg-muted px-1 rounded">
                                {translation.key}
                              </code>
                            </div>
                            <p className="mt-1">{translation.value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTranslation(translation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="add" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المفتاح</Label>
                    <Input
                      value={translationForm.key}
                      onChange={(e) => setTranslationForm({ ...translationForm, key: e.target.value })}
                      placeholder="nav.home"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الفئة</Label>
                    <Select
                      value={translationForm.category}
                      onValueChange={(value) => setTranslationForm({ ...translationForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSLATION_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الترجمة</Label>
                  <Textarea
                    value={translationForm.value}
                    onChange={(e) => setTranslationForm({ ...translationForm, value: e.target.value })}
                    placeholder="أدخل الترجمة هنا"
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddTranslation} className="w-full btn-gold">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة الترجمة
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من حذف هذه اللغة؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف اللغة "{selectedLanguage?.native_name}" وجميع ترجماتها. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLanguages;
