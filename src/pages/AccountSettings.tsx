import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Mail, 
  Lock, 
  Save, 
  Loader2, 
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

const AccountSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Email state
  const [email, setEmail] = useState(user?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErrors, setEmailErrors] = useState<{ email?: string }>({});

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ 
    currentPassword?: string; 
    newPassword?: string; 
    confirmPassword?: string 
  }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse({ email });
      setEmailErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
        });
        setEmailErrors(fieldErrors);
        return;
      }
    }

    if (email === user?.email) {
      toast({
        title: 'تنبيه',
        description: 'البريد الإلكتروني الجديد مطابق للحالي',
        variant: 'destructive',
      });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;

      toast({
        title: 'تم إرسال رابط التأكيد',
        description: 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني الجديد',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث البريد الإلكتروني',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse({ currentPassword, newPassword, confirmPassword });
      setPasswordErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof typeof fieldErrors;
          fieldErrors[field] = err.message;
        });
        setPasswordErrors(fieldErrors);
        return;
      }
    }

    setPasswordLoading(true);
    try {
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'خطأ',
          description: 'كلمة المرور الحالية غير صحيحة',
          variant: 'destructive',
        });
        setPasswordLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث كلمة المرور بنجاح',
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 ml-2" />
              رجوع
            </Button>
            <h1 className="text-xl font-bold text-gradient-gold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات الحساب
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Email Info */}
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              البريد الإلكتروني الحالي: <strong dir="ltr">{user.email}</strong>
            </AlertDescription>
          </Alert>

          {/* Email Update Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gold" />
                تغيير البريد الإلكتروني
              </CardTitle>
              <CardDescription>
                سيتم إرسال رابط تأكيد إلى بريدك الإلكتروني الجديد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني الجديد</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="text-left"
                  />
                  {emailErrors.email && (
                    <p className="text-destructive text-sm">{emailErrors.email}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={emailLoading}
                  className="btn-gold"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      تحديث البريد الإلكتروني
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Update Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>
                أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-destructive text-sm">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-destructive text-sm">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-destructive text-sm">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    تأكد من حفظ كلمة المرور الجديدة في مكان آمن
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="btn-gold"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      تحديث كلمة المرور
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AccountSettings;