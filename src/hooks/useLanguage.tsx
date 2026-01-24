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
    // Navigation
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
    // Common
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
    'common.refresh': 'تحديث',
    'common.view': 'عرض',
    'common.actions': 'إجراءات',
    'common.status': 'الحالة',
    'common.date': 'التاريخ',
    'common.time': 'الوقت',
    'common.total': 'الإجمالي',
    'common.all': 'الكل',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.pending': 'قيد الانتظار',
    'common.approved': 'معتمد',
    'common.rejected': 'مرفوض',
    'common.confirm': 'تأكيد',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.submit': 'إرسال',
    'common.reset': 'إعادة تعيين',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    // Auth
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signUp': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.rememberMe': 'تذكرني',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.newPassword': 'كلمة المرور الجديدة',
    // Subscription
    'subscription.plans': 'خطط الاشتراك',
    'subscription.subscribe': 'اشترك الآن',
    'subscription.upgrade': 'ترقية',
    'subscription.current': 'الخطة الحالية',
    'subscription.expired': 'منتهي',
    'subscription.cancelled': 'ملغي',
    'subscription.renew': 'تجديد',
    'subscription.autoRenew': 'التجديد التلقائي',
    // Player
    'player.profile': 'الملف الشخصي',
    'player.name': 'الاسم',
    'player.position': 'المركز',
    'player.nationality': 'الجنسية',
    'player.age': 'العمر',
    'player.height': 'الطول',
    'player.weight': 'الوزن',
    'player.bio': 'نبذة',
    'player.videos': 'فيديوهات',
    'player.currentClub': 'النادي الحالي',
    'player.previousClubs': 'الأندية السابقة',
    // Club
    'club.dashboard': 'لوحة تحكم النادي',
    'club.profile': 'ملف النادي',
    'club.favorites': 'المفضلة',
    'club.city': 'المدينة',
    'club.country': 'الدولة',
    'club.website': 'الموقع الإلكتروني',
    'club.phone': 'الهاتف',
    // Admin
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
    'admin.consultations': 'الاستشارات',
    'admin.meetLogs': 'سجل Meet',
    'admin.playerInterests': 'اهتمامات الأندية',
    // Consultation
    'consultation.booking': 'حجز استشارة',
    'consultation.myConsultations': 'استشاراتي',
    'consultation.bookNow': 'احجز الآن',
    'consultation.selectDate': 'اختر التاريخ',
    'consultation.selectTime': 'اختر الوقت',
    'consultation.availableSlots': 'المواعيد المتاحة',
    'consultation.noSlots': 'لا توجد مواعيد متاحة',
    'consultation.fee': 'رسوم الاستشارة',
    'consultation.duration': 'المدة',
    'consultation.minutes': 'دقيقة',
    'consultation.confirmed': 'مؤكد',
    'consultation.pending': 'قيد الانتظار',
    'consultation.cancelled': 'ملغي',
    'consultation.completed': 'مكتمل',
    'consultation.notes': 'ملاحظات',
    'consultation.paymentMethod': 'طريقة الدفع',
    'consultation.uploadProof': 'رفع إثبات الدفع',
    'consultation.joinMeeting': 'انضم للاجتماع',
    // Meet
    'meet.logs': 'سجل اجتماعات Google Meet',
    'meet.trackMeetings': 'تتبع جميع اجتماعات Meet التي تم إنشاؤها',
    'meet.total': 'إجمالي',
    'meet.created': 'تم الإنشاء',
    'meet.active': 'نشط',
    'meet.completed': 'مكتمل',
    'meet.cancelled': 'ملغي',
    'meet.error': 'خطأ',
    'meet.expired': 'منتهي',
    'meet.errors': 'أخطاء',
    'meet.player': 'اللاعب',
    'meet.meetingLink': 'رابط الاجتماع',
    'meet.regenerateCount': 'إعادة الإنشاء',
    'meet.createdAt': 'تاريخ الإنشاء',
    'meet.searchPlaceholder': 'بحث باسم اللاعب أو رابط الاجتماع...',
    'meet.allStatuses': 'جميع الحالات',
    'meet.noLogs': 'لا توجد سجلات اجتماعات',
    'meet.unknown': 'غير معروف',
    'meet.times': 'مرة',
    // Messages
    'messages.inbox': 'صندوق الوارد',
    'messages.sent': 'المرسلة',
    'messages.compose': 'رسالة جديدة',
    'messages.subject': 'الموضوع',
    'messages.content': 'المحتوى',
    'messages.send': 'إرسال',
    'messages.noMessages': 'لا توجد رسائل',
    'messages.markAsRead': 'تحديد كمقروء',
    'messages.reply': 'رد',
    'messages.from': 'من',
    'messages.to': 'إلى',
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.markAllRead': 'تحديد الكل كمقروء',
    'notifications.noNotifications': 'لا توجد إشعارات',
    'notifications.newMessage': 'رسالة جديدة',
    'notifications.consultationReminder': 'تذكير بالاستشارة',
    'notifications.subscriptionExpiring': 'اشتراكك على وشك الانتهاء',
    'notifications.playerApproved': 'تم اعتماد ملفك',
    'notifications.playerRejected': 'تم رفض ملفك',
    'notifications.interestReceived': 'اهتمام جديد من نادي',
  },
  en: {
    // Navigation
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
    // Common
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
    'common.refresh': 'Refresh',
    'common.view': 'View',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.total': 'Total',
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.reset': 'Reset',
    'common.export': 'Export',
    'common.import': 'Import',
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember Me',
    'auth.confirmPassword': 'Confirm Password',
    'auth.newPassword': 'New Password',
    // Subscription
    'subscription.plans': 'Subscription Plans',
    'subscription.subscribe': 'Subscribe Now',
    'subscription.upgrade': 'Upgrade',
    'subscription.current': 'Current Plan',
    'subscription.expired': 'Expired',
    'subscription.cancelled': 'Cancelled',
    'subscription.renew': 'Renew',
    'subscription.autoRenew': 'Auto Renew',
    // Player
    'player.profile': 'Profile',
    'player.name': 'Name',
    'player.position': 'Position',
    'player.nationality': 'Nationality',
    'player.age': 'Age',
    'player.height': 'Height',
    'player.weight': 'Weight',
    'player.bio': 'Bio',
    'player.videos': 'Videos',
    'player.currentClub': 'Current Club',
    'player.previousClubs': 'Previous Clubs',
    // Club
    'club.dashboard': 'Club Dashboard',
    'club.profile': 'Club Profile',
    'club.favorites': 'Favorites',
    'club.city': 'City',
    'club.country': 'Country',
    'club.website': 'Website',
    'club.phone': 'Phone',
    // Admin
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
    'admin.consultations': 'Consultations',
    'admin.meetLogs': 'Meet Logs',
    'admin.playerInterests': 'Club Interests',
    // Consultation
    'consultation.booking': 'Book Consultation',
    'consultation.myConsultations': 'My Consultations',
    'consultation.bookNow': 'Book Now',
    'consultation.selectDate': 'Select Date',
    'consultation.selectTime': 'Select Time',
    'consultation.availableSlots': 'Available Slots',
    'consultation.noSlots': 'No available slots',
    'consultation.fee': 'Consultation Fee',
    'consultation.duration': 'Duration',
    'consultation.minutes': 'minutes',
    'consultation.confirmed': 'Confirmed',
    'consultation.pending': 'Pending',
    'consultation.cancelled': 'Cancelled',
    'consultation.completed': 'Completed',
    'consultation.notes': 'Notes',
    'consultation.paymentMethod': 'Payment Method',
    'consultation.uploadProof': 'Upload Payment Proof',
    'consultation.joinMeeting': 'Join Meeting',
    // Meet
    'meet.logs': 'Google Meet Logs',
    'meet.trackMeetings': 'Track all created Meet meetings',
    'meet.total': 'Total',
    'meet.created': 'Created',
    'meet.active': 'Active',
    'meet.completed': 'Completed',
    'meet.cancelled': 'Cancelled',
    'meet.error': 'Error',
    'meet.expired': 'Expired',
    'meet.errors': 'Errors',
    'meet.player': 'Player',
    'meet.meetingLink': 'Meeting Link',
    'meet.regenerateCount': 'Regenerated',
    'meet.createdAt': 'Created At',
    'meet.searchPlaceholder': 'Search by player name or meeting link...',
    'meet.allStatuses': 'All Statuses',
    'meet.noLogs': 'No meeting logs',
    'meet.unknown': 'Unknown',
    'meet.times': 'times',
    // Messages
    'messages.inbox': 'Inbox',
    'messages.sent': 'Sent',
    'messages.compose': 'New Message',
    'messages.subject': 'Subject',
    'messages.content': 'Content',
    'messages.send': 'Send',
    'messages.noMessages': 'No messages',
    'messages.markAsRead': 'Mark as Read',
    'messages.reply': 'Reply',
    'messages.from': 'From',
    'messages.to': 'To',
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark All as Read',
    'notifications.noNotifications': 'No notifications',
    'notifications.newMessage': 'New Message',
    'notifications.consultationReminder': 'Consultation Reminder',
    'notifications.subscriptionExpiring': 'Your subscription is expiring soon',
    'notifications.playerApproved': 'Your profile was approved',
    'notifications.playerRejected': 'Your profile was rejected',
    'notifications.interestReceived': 'New interest from a club',
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
