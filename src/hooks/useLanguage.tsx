import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  key: string;
  value: string;
  category: string;
}

interface LanguageContextType {
  currentLanguage: Language | null;
  languages: Language[];
  translations: Record<string, string>;
  loading: boolean;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'preferred_language';

// Default translations (fallback)
const defaultTranslations: Record<string, Record<string, string>> = {
  ar: {
    'nav.home': 'الرئيسية',
    'nav.players': 'اللاعبين',
    'nav.clubs': 'الأندية',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'تسجيل جديد',
    'nav.dashboard': 'لوحة التحكم',
    'nav.messages': 'الرسائل',
    'nav.logout': 'تسجيل الخروج',
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'فلترة',
    'common.noResults': 'لا توجد نتائج',
    'common.error': 'خطأ',
    'common.success': 'تم بنجاح',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signUp': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'subscription.plans': 'خطط الاشتراك',
    'subscription.subscribe': 'اشترك الآن',
    'subscription.upgrade': 'ترقية',
    'subscription.current': 'الخطة الحالية',
    'player.profile': 'الملف الشخصي',
    'player.name': 'الاسم',
    'player.position': 'المركز',
    'player.nationality': 'الجنسية',
    'player.age': 'العمر',
    'player.height': 'الطول',
    'player.weight': 'الوزن',
    'club.dashboard': 'لوحة تحكم النادي',
    'club.profile': 'ملف النادي',
    'club.favorites': 'المفضلة',
    // Admin translations
    'admin.dashboard': 'لوحة التحكم',
    'admin.overview': 'نظرة عامة على إحصائيات الموقع',
    'admin.players': 'اللاعبون',
    'admin.clubs': 'الأندية',
    'admin.subscriptions': 'الاشتراكات',
    'admin.plans': 'باقات الاشتراك',
    'admin.payments': 'وسائل الدفع',
    'admin.pages': 'الصفحات',
    'admin.menus': 'القوائم',
    'admin.languages': 'اللغات',
    'admin.design': 'التصميم',
    'admin.sections': 'السيكشنز',
    'admin.footer': 'الفوتر',
    'admin.social': 'التواصل الاجتماعي',
    'admin.settings': 'الإعدادات',
    'admin.backToSite': 'العودة للموقع',
    'admin.logout': 'تسجيل الخروج',
    'admin.quickSearch': 'بحث سريع...',
    'admin.totalPlayers': 'إجمالي اللاعبين',
    'admin.pendingApproval': 'في انتظار الموافقة',
    'admin.approvedPlayers': 'لاعبون معتمدون',
    'admin.registeredClubs': 'الأندية المسجلة',
    'admin.activeSubscriptions': 'اشتراكات نشطة',
    'admin.totalRevenue': 'إجمالي الإيرادات',
    'admin.quickActions': 'إجراءات سريعة',
    'admin.reviewNewPlayers': 'مراجعة اللاعبين الجدد',
    'admin.managePlans': 'إدارة الباقات',
    'admin.siteSettings': 'إعدادات الموقع',
  },
  en: {
    'nav.home': 'Home',
    'nav.players': 'Players',
    'nav.clubs': 'Clubs',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.messages': 'Messages',
    'nav.logout': 'Logout',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.noResults': 'No results',
    'common.error': 'Error',
    'common.success': 'Success',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.forgotPassword': 'Forgot Password?',
    'subscription.plans': 'Subscription Plans',
    'subscription.subscribe': 'Subscribe Now',
    'subscription.upgrade': 'Upgrade',
    'subscription.current': 'Current Plan',
    'player.profile': 'Profile',
    'player.name': 'Name',
    'player.position': 'Position',
    'player.nationality': 'Nationality',
    'player.age': 'Age',
    'player.height': 'Height',
    'player.weight': 'Weight',
    'club.dashboard': 'Club Dashboard',
    'club.profile': 'Club Profile',
    'club.favorites': 'Favorites',
    // Admin translations
    'admin.dashboard': 'Dashboard',
    'admin.overview': 'Overview of site statistics',
    'admin.players': 'Players',
    'admin.clubs': 'Clubs',
    'admin.subscriptions': 'Subscriptions',
    'admin.plans': 'Subscription Plans',
    'admin.payments': 'Payment Methods',
    'admin.pages': 'Pages',
    'admin.menus': 'Menus',
    'admin.languages': 'Languages',
    'admin.design': 'Design',
    'admin.sections': 'Sections',
    'admin.footer': 'Footer',
    'admin.social': 'Social Media',
    'admin.settings': 'Settings',
    'admin.backToSite': 'Back to Site',
    'admin.logout': 'Logout',
    'admin.quickSearch': 'Quick search...',
    'admin.totalPlayers': 'Total Players',
    'admin.pendingApproval': 'Pending Approval',
    'admin.approvedPlayers': 'Approved Players',
    'admin.registeredClubs': 'Registered Clubs',
    'admin.activeSubscriptions': 'Active Subscriptions',
    'admin.totalRevenue': 'Total Revenue',
    'admin.quickActions': 'Quick Actions',
    'admin.reviewNewPlayers': 'Review New Players',
    'admin.managePlans': 'Manage Plans',
    'admin.siteSettings': 'Site Settings',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (currentLanguage) {
      fetchTranslations(currentLanguage.code);
      document.documentElement.dir = currentLanguage.direction;
      document.documentElement.lang = currentLanguage.code;
      localStorage.setItem(STORAGE_KEY, currentLanguage.code);
    }
  }, [currentLanguage]);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const langs = data as Language[];
      setLanguages(langs);

      // Determine which language to use
      const savedLang = localStorage.getItem(STORAGE_KEY);
      const browserLang = navigator.language.split('-')[0];
      
      let selectedLang = langs.find(l => l.code === savedLang) ||
                         langs.find(l => l.code === browserLang) ||
                         langs.find(l => l.is_default) ||
                         langs[0];

      if (selectedLang) {
        setCurrentLanguage(selectedLang);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      // Fallback to Arabic
      setCurrentLanguage({
        id: 'default',
        code: 'ar',
        name: 'Arabic',
        native_name: 'العربية',
        direction: 'rtl',
        is_active: true,
        is_default: true,
        order_index: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslations = async (langCode: string) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language_code', langCode);

      if (error) throw error;

      const translationMap: Record<string, string> = {};
      (data || []).forEach((t: Translation) => {
        translationMap[t.key] = t.value;
      });

      // Merge with default translations
      const defaults = defaultTranslations[langCode] || defaultTranslations['ar'];
      setTranslations({ ...defaults, ...translationMap });
    } catch (error) {
      console.error('Error fetching translations:', error);
      setTranslations(defaultTranslations[langCode] || defaultTranslations['ar']);
    }
  };

  const setLanguage = (code: string) => {
    const lang = languages.find(l => l.code === code);
    if (lang) {
      setCurrentLanguage(lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languages,
        translations,
        loading,
        setLanguage,
        t,
        direction: currentLanguage?.direction || 'rtl',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
