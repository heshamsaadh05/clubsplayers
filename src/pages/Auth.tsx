import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type AuthMode = 'login' | 'register-player' | 'register-club';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, roles, signIn, signUp, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Function to determine redirect path based on user role
  const getRedirectPath = useCallback(async (userId: string): Promise<string> => {
    // Check if admin
    if (roles.includes('admin')) {
      return '/admin';
    }

    // Check if player exists
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (playerData) {
      return '/player-dashboard';
    }

    // Check if club exists
    const { data: clubData } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (clubData) {
      return '/club-dashboard';
    }

    // Default to home page
    return '/';
  }, [roles]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'player') setMode('register-player');
    else if (type === 'club') setMode('register-club');
  }, [searchParams]);

  useEffect(() => {
    const redirectUser = async () => {
      if (user && !authLoading) {
        const path = await getRedirectPath(user.id);
        navigate(path);
      }
    };
    redirectUser();
  }, [user, authLoading, roles, navigate, getRedirectPath]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'خطأ في تسجيل الدخول',
            description: error.message === 'Invalid login credentials' 
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'تم تسجيل الدخول بنجاح',
            description: 'مرحباً بك مجدداً!',
          });
          // Redirect will happen automatically via useEffect
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: 'خطأ في إنشاء الحساب',
            description: error.message === 'User already registered'
              ? 'هذا البريد الإلكتروني مسجل بالفعل'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'تم إنشاء الحساب بنجاح',
            description: 'يمكنك الآن إكمال التسجيل',
          });
          // Redirect to registration page based on mode
          navigate(mode === 'register-player' ? '/player-registration' : '/club-registration');
        }
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-gradient-gold font-playfair">
            ستارز إيجنسي
          </a>
          <p className="text-muted-foreground mt-2">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </p>
        </div>

        {/* Mode Selector */}
        {mode !== 'login' && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMode('register-player')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mode === 'register-player'
                  ? 'bg-gold text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <User className="w-5 h-5" />
              لاعب
            </button>
            <button
              onClick={() => setMode('register-club')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                mode === 'register-club'
                  ? 'bg-gold text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Building2 className="w-5 h-5" />
              نادي
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="pr-10 bg-secondary border-border"
                dir="ltr"
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10 bg-secondary border-border"
              />
            </div>
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-gold rounded-xl py-6 text-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              <>
                تسجيل الدخول
                <ArrowRight className="w-5 h-5 mr-2" />
              </>
            ) : (
              <>
                إنشاء الحساب
                <ArrowRight className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          {mode === 'login' ? (
            <p className="text-muted-foreground">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => setMode('register-player')}
                className="text-gold hover:underline"
              >
                إنشاء حساب جديد
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => setMode('login')}
                className="text-gold hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
