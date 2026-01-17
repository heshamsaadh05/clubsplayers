import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, Eye, EyeOff, Key, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  is_active: boolean;
  config: Record<string, string>;
  instructions: string;
  instructions_ar: string;
}

interface ConfigField {
  key: string;
  label: string;
  labelEn: string;
  isSecret?: boolean;
  placeholder?: string;
  required?: boolean;
}

const AdminPayments = () => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentMethod>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const processedData = (data || []).map(pm => ({
        ...pm,
        config: typeof pm.config === 'object' ? pm.config : {}
      }));
      
      setPaymentMethods(processedData as PaymentMethod[]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setEditForm({
      is_active: method.is_active,
      config: method.config,
      instructions: method.instructions,
      instructions_ar: method.instructions_ar,
    });
    setShowSecrets({});
  };

  const saveEdit = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          is_active: editForm.is_active,
          config: editForm.config,
          instructions: editForm.instructions,
          instructions_ar: editForm.instructions_ar,
        })
        .eq('id', methodId);

      if (error) throw error;

      toast({ title: 'تم حفظ التغييرات بنجاح' });
      setEditingId(null);
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (methodId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', methodId);

      if (error) throw error;
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التحديث',
        variant: 'destructive',
      });
    }
  };

  const testConnection = async (method: PaymentMethod) => {
    setTestingConnection(method.id);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const config = method.config || {};
    const hasRequiredKeys = getConfigFields(method.type)
      .filter(f => f.required)
      .every(f => config[f.key]);

    if (hasRequiredKeys) {
      toast({
        title: 'تم الاتصال بنجاح',
        description: `تم التحقق من إعدادات ${method.name_ar}`,
      });
    } else {
      toast({
        title: 'فشل الاتصال',
        description: 'تأكد من إدخال جميع المفاتيح المطلوبة',
        variant: 'destructive',
      });
    }
    
    setTestingConnection(null);
  };

  const toggleSecretVisibility = (fieldKey: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const getPaymentIcon = (type: string) => {
    const icons: Record<string, string> = {
      paypal: '💳',
      stripe: '💳',
      bank_transfer: '🏦',
      wallet: '📱',
      fawry: '💵',
      opay: '📲',
      '2checkout': '🛒',
    };
    return icons[type] || '💰';
  };

  const getConfigFields = (type: string): ConfigField[] => {
    switch (type) {
      case 'stripe':
        return [
          { key: 'publishable_key', label: 'المفتاح العام (Publishable Key)', labelEn: 'Publishable Key', placeholder: 'pk_live_...', required: true },
          { key: 'secret_key', label: 'المفتاح السري (Secret Key)', labelEn: 'Secret Key', isSecret: true, placeholder: 'sk_live_...', required: true },
          { key: 'webhook_secret', label: 'مفتاح Webhook', labelEn: 'Webhook Secret', isSecret: true, placeholder: 'whsec_...' },
        ];
      case 'paypal':
        return [
          { key: 'client_id', label: 'معرف العميل (Client ID)', labelEn: 'Client ID', placeholder: 'A...', required: true },
          { key: 'client_secret', label: 'المفتاح السري (Client Secret)', labelEn: 'Client Secret', isSecret: true, placeholder: 'E...', required: true },
          { key: 'mode', label: 'الوضع (sandbox/live)', labelEn: 'Mode', placeholder: 'live' },
        ];
      case 'bank_transfer':
        return [
          { key: 'bank_name', label: 'اسم البنك', labelEn: 'Bank Name', required: true },
          { key: 'account_name', label: 'اسم صاحب الحساب', labelEn: 'Account Holder Name', required: true },
          { key: 'account_number', label: 'رقم الحساب', labelEn: 'Account Number', required: true },
          { key: 'iban', label: 'رقم IBAN', labelEn: 'IBAN' },
          { key: 'swift_code', label: 'رمز SWIFT', labelEn: 'SWIFT Code' },
        ];
      case 'wallet':
        return [
          { key: 'wallet_type', label: 'نوع المحفظة', labelEn: 'Wallet Type', placeholder: 'Vodafone Cash / InstaPay' },
          { key: 'wallet_number', label: 'رقم المحفظة', labelEn: 'Wallet Number', required: true },
          { key: 'wallet_name', label: 'اسم صاحب المحفظة', labelEn: 'Wallet Holder Name' },
        ];
      case 'fawry':
        return [
          { key: 'merchant_code', label: 'كود التاجر', labelEn: 'Merchant Code', required: true },
          { key: 'security_key', label: 'مفتاح الأمان', labelEn: 'Security Key', isSecret: true, required: true },
        ];
      case 'opay':
        return [
          { key: 'merchant_id', label: 'معرف التاجر', labelEn: 'Merchant ID', required: true },
          { key: 'public_key', label: 'المفتاح العام', labelEn: 'Public Key', required: true },
          { key: 'secret_key', label: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true, required: true },
        ];
      case '2checkout':
        return [
          { key: 'merchant_code', label: 'كود التاجر', labelEn: 'Merchant Code', required: true },
          { key: 'secret_key', label: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true, required: true },
          { key: 'buy_link_secret', label: 'Buy Link Secret', labelEn: 'Buy Link Secret', isSecret: true },
        ];
      default:
        return [];
    }
  };

  const isConfigured = (method: PaymentMethod) => {
    const requiredFields = getConfigFields(method.type).filter(f => f.required);
    return requiredFields.every(f => method.config?.[f.key]);
  };

  const maskSecret = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">وسائل الدفع</h1>
          <p className="text-muted-foreground mt-1">إدارة وربط وتفعيل وسائل الدفع المتاحة</p>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <p className="text-muted-foreground">جاري التحميل...</p>
          ) : (
            paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card-glass rounded-2xl overflow-hidden ${!method.is_active ? 'opacity-60' : ''}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getPaymentIcon(method.type)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{method.name_ar}</h3>
                      <p className="text-sm text-muted-foreground">{method.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured(method) ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        مُعد
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                        <AlertCircle className="w-3 h-3 ml-1" />
                        غير مُعد
                      </Badge>
                    )}
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={() => toggleActive(method.id, method.is_active)}
                    />
                  </div>
                </div>

                {editingId === method.id ? (
                  // Edit Mode
                  <div className="p-4">
                    <Tabs defaultValue="keys" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="keys" className="gap-2">
                          <Key className="w-4 h-4" />
                          المفاتيح
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                          <Settings className="w-4 h-4" />
                          الإعدادات
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="keys" className="space-y-4">
                        {getConfigFields(method.type).length > 0 ? (
                          getConfigFields(method.type).map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label className="flex items-center gap-2">
                                {field.label}
                                {field.required && <span className="text-red-500">*</span>}
                                {field.isSecret && <Key className="w-3 h-3 text-amber-500" />}
                              </Label>
                              <div className="relative">
                                <Input
                                  type={field.isSecret && !showSecrets[field.key] ? 'password' : 'text'}
                                  value={(editForm.config as Record<string, string>)?.[field.key] || ''}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      config: {
                                        ...(editForm.config as Record<string, string>),
                                        [field.key]: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder={field.placeholder}
                                  className="bg-secondary pl-10"
                                />
                                {field.isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecretVisibility(field.key)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showSecrets[field.key] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            لا يتطلب هذا النوع مفاتيح API
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <Label>تفعيل وسيلة الدفع</Label>
                          <Switch
                            checked={editForm.is_active}
                            onCheckedChange={(checked) =>
                              setEditForm({ ...editForm, is_active: checked })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>التعليمات (عربي)</Label>
                          <Textarea
                            value={editForm.instructions_ar || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, instructions_ar: e.target.value })
                            }
                            className="bg-secondary min-h-[100px]"
                            placeholder="أدخل تعليمات الدفع للعملاء..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>التعليمات (إنجليزي)</Label>
                          <Textarea
                            value={editForm.instructions || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, instructions: e.target.value })
                            }
                            className="bg-secondary min-h-[100px]"
                            placeholder="Enter payment instructions..."
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 mt-6">
                      <Button
                        className="flex-1 btn-gold"
                        onClick={() => saveEdit(method.id)}
                      >
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التغييرات
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-4 space-y-4">
                    {/* Configuration Status */}
                    {getConfigFields(method.type).length > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-foreground mb-2">حالة الإعداد:</p>
                        {getConfigFields(method.type).map(field => {
                          const value = method.config?.[field.key];
                          return (
                            <div key={field.key} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{field.label}:</span>
                              <span className={value ? 'text-green-500' : 'text-amber-500'}>
                                {value ? (
                                  field.isSecret ? maskSecret(value) : (
                                    value.length > 20 ? value.substring(0, 20) + '...' : value
                                  )
                                ) : (
                                  'غير مُعد'
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Instructions Preview */}
                    {method.instructions_ar && (
                      <p className="text-sm text-muted-foreground">
                        {method.instructions_ar}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => startEdit(method)}
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل الإعدادات
                      </Button>
                      {getConfigFields(method.type).some(f => f.isSecret) && (
                        <Button
                          variant="outline"
                          onClick={() => testConnection(method)}
                          disabled={testingConnection === method.id}
                        >
                          {testingConnection === method.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            'اختبار'
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Status */}
                    <div className={`text-center text-sm py-2 rounded-lg ${
                      method.is_active 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {method.is_active ? '✓ مفعّل وجاهز للاستخدام' : '○ غير مفعّل'}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card-glass rounded-2xl p-6 mt-8"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">📚 دليل إعداد وسائل الدفع</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gold mb-2">Stripe</h4>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>سجل في <a href="https://stripe.com" target="_blank" className="text-gold hover:underline">stripe.com</a></li>
                <li>اذهب إلى Developers → API Keys</li>
                <li>انسخ Publishable Key و Secret Key</li>
                <li>الصق المفاتيح في الحقول أعلاه</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gold mb-2">PayPal</h4>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>سجل في <a href="https://developer.paypal.com" target="_blank" className="text-gold hover:underline">developer.paypal.com</a></li>
                <li>أنشئ تطبيق جديد</li>
                <li>انسخ Client ID و Secret</li>
                <li>اختر live للإنتاج أو sandbox للاختبار</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gold mb-2">التحويل البنكي</h4>
              <p className="text-muted-foreground">أدخل بيانات حسابك البنكي ليتمكن العملاء من التحويل إليه مباشرة.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gold mb-2">المحافظ الإلكترونية</h4>
              <p className="text-muted-foreground">أدخل رقم محفظتك (Vodafone Cash, InstaPay, إلخ) لاستلام المدفوعات.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
