import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, CreditCard } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

const AdminPayments = () => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentMethod>>({});

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

  const getPaymentIcon = (type: string) => {
    const icons: Record<string, string> = {
      paypal: '💳',
      stripe: '💳',
      bank_transfer: '🏦',
      wallet: '📱',
      kashier: '💵',
      opay: '📲',
      '2checkout': '🛒',
    };
    return icons[type] || '💰';
  };

  const getConfigFields = (type: string): { key: string; label: string }[] => {
    switch (type) {
      case 'paypal':
        return [{ key: 'email', label: 'بريد PayPal' }];
      case 'bank_transfer':
        return [
          { key: 'bank_name', label: 'اسم البنك' },
          { key: 'account_number', label: 'رقم الحساب' },
          { key: 'iban', label: 'رقم IBAN' },
        ];
      case 'wallet':
        return [{ key: 'wallet_number', label: 'رقم المحفظة' }];
      default:
        return [];
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">وسائل الدفع</h1>
          <p className="text-muted-foreground mt-1">إدارة وتفعيل وسائل الدفع المتاحة</p>
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
                className={`card-glass rounded-2xl p-6 ${!method.is_active ? 'opacity-60' : ''}`}
              >
                {editingId === method.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPaymentIcon(method.type)}</span>
                        <h3 className="text-lg font-bold">{method.name_ar}</h3>
                      </div>
                      <Button
                        size="sm"
                        className="btn-gold"
                        onClick={() => saveEdit(method.id)}
                      >
                        <Save className="w-4 h-4 ml-2" />
                        حفظ
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>تفعيل وسيلة الدفع</Label>
                      <Switch
                        checked={editForm.is_active}
                        onCheckedChange={(checked) =>
                          setEditForm({ ...editForm, is_active: checked })
                        }
                      />
                    </div>

                    {getConfigFields(method.type).map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input
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
                          className="bg-secondary"
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label>التعليمات (عربي)</Label>
                      <Textarea
                        value={editForm.instructions_ar || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, instructions_ar: e.target.value })
                        }
                        className="bg-secondary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>التعليمات (إنجليزي)</Label>
                      <Textarea
                        value={editForm.instructions || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, instructions: e.target.value })
                        }
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getPaymentIcon(method.type)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{method.name_ar}</h3>
                          <p className="text-sm text-muted-foreground">{method.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(method)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gold" />
                        </button>
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={() => toggleActive(method.id, method.is_active)}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {method.instructions_ar}
                    </p>

                    {Object.entries(method.config || {}).length > 0 && (
                      <div className="bg-secondary rounded-lg p-3 text-sm">
                        {Object.entries(method.config).map(([key, value]) => (
                          value && (
                            <div key={key} className="flex justify-between py-1">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="text-foreground">{value}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    <div className={`mt-4 text-center text-sm ${
                      method.is_active ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {method.is_active ? '✓ مفعّل' : '○ غير مفعّل'}
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
