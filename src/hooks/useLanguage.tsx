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
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.update': 'تحديث',
    'common.details': 'التفاصيل',
    'common.info': 'معلومات',
    'common.unknown': 'غير معروف',
    'common.none': 'لا يوجد',
    'common.selectAll': 'اختيار الكل',
    'common.clearAll': 'مسح الكل',
    'common.required': 'مطلوب',
    'common.optional': 'اختياري',
    'common.description': 'الوصف',
    'common.name': 'الاسم',
    'common.email': 'البريد الإلكتروني',
    'common.phone': 'الهاتف',
    'common.notes': 'ملاحظات',
    'common.copy': 'نسخ',
    'common.copied': 'تم النسخ',
    
    // Auth
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signUp': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.rememberMe': 'تذكرني',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.newPassword': 'كلمة المرور الجديدة',
    'auth.loginRequired': 'يجب تسجيل الدخول أولاً',
    'auth.invalidCredentials': 'بيانات الدخول غير صحيحة',
    'auth.accountCreated': 'تم إنشاء الحساب بنجاح',
    'auth.logoutSuccess': 'تم تسجيل الخروج بنجاح',
    'auth.resetPasswordSent': 'تم إرسال رابط إعادة تعيين كلمة المرور',
    
    // Subscription
    'subscription.plans': 'خطط الاشتراك',
    'subscription.subscribe': 'اشترك الآن',
    'subscription.upgrade': 'ترقية',
    'subscription.current': 'الخطة الحالية',
    'subscription.expired': 'منتهي',
    'subscription.cancelled': 'ملغي',
    'subscription.renew': 'تجديد',
    'subscription.autoRenew': 'التجديد التلقائي',
    'subscription.startDate': 'تاريخ البداية',
    'subscription.endDate': 'تاريخ الانتهاء',
    'subscription.daysRemaining': 'الأيام المتبقية',
    'subscription.paymentProof': 'إثبات الدفع',
    'subscription.activated': 'تم تفعيل الاشتراك بنجاح',
    'subscription.updateError': 'حدث خطأ في تحديث الإعدادات',
    
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
    'player.registrationSuccess': 'تم تقديم طلب التسجيل بنجاح! سيتم مراجعته من قبل الإدارة.',
    'player.profileImageRequired': 'الصورة الشخصية مطلوبة',
    'player.idDocumentRequired': 'صورة الهوية مطلوبة',
    'player.maxVideos': 'يمكنك رفع 5 فيديوهات كحد أقصى',
    'player.imageSizeLimit': 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت',
    'player.fileSizeLimit': 'حجم الملف يجب ألا يتجاوز 10 ميجابايت',
    
    // Club
    'club.dashboard': 'لوحة تحكم النادي',
    'club.profile': 'ملف النادي',
    'club.favorites': 'المفضلة',
    'club.city': 'المدينة',
    'club.country': 'الدولة',
    'club.website': 'الموقع الإلكتروني',
    'club.phone': 'الهاتف',
    'club.nameRequired': 'اسم النادي مطلوب',
    'club.emailRequired': 'البريد الإلكتروني مطلوب',
    'club.logoUploadSuccess': 'تم رفع الشعار بنجاح',
    'club.logoUploadError': 'حدث خطأ أثناء رفع الشعار',
    'club.updateSuccess': 'تم حفظ التغييرات بنجاح',
    'club.updateError': 'حدث خطأ أثناء حفظ التغييرات',
    'club.logoSizeLimit': 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت',
    'club.invalidImage': 'يرجى اختيار صورة صالحة',
    
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
    'admin.manageLanguages': 'إدارة اللغات',
    'admin.languagesDesc': 'إضافة وتعديل وحذف اللغات المتاحة في الموقع',
    'admin.addLanguage': 'إضافة لغة جديدة',
    'admin.editLanguage': 'تعديل اللغة',
    'admin.languageCode': 'كود اللغة',
    'admin.languageName': 'اسم اللغة (بالإنجليزية)',
    'admin.languageNativeName': 'اسم اللغة (بلغتها الأصلية)',
    'admin.languageDirection': 'الاتجاه',
    'admin.rtl': 'يمين لليسار (RTL)',
    'admin.ltr': 'يسار لليمين (LTR)',
    'admin.defaultLanguage': 'اللغة الافتراضية',
    'admin.activateLanguage': 'تفعيل اللغة',
    'admin.translations': 'الترجمات',
    'admin.translationsFor': 'ترجمات',
    'admin.addTranslation': 'إضافة ترجمة',
    'admin.translationKey': 'المفتاح',
    'admin.translationValue': 'الترجمة',
    'admin.translationCategory': 'الفئة',
    'admin.currentTranslations': 'الترجمات الحالية',
    'admin.filterByCategory': 'فلترة حسب الفئة',
    'admin.allCategories': 'جميع الفئات',
    'admin.noTranslationsInCategory': 'لا توجد ترجمات في هذه الفئة',
    'admin.languageAdded': 'تم إضافة اللغة بنجاح',
    'admin.languageUpdated': 'تم تحديث اللغة بنجاح',
    'admin.languageDeleted': 'تم حذف اللغة بنجاح',
    'admin.translationAdded': 'تم حفظ الترجمة بنجاح',
    'admin.translationDeleted': 'تم حذف الترجمة',
    'admin.cannotDeleteDefault': 'لا يمكن حذف اللغة الافتراضية',
    'admin.deleteLanguageConfirm': 'هل أنت متأكد من حذف هذه اللغة؟',
    'admin.deleteLanguageWarning': 'سيتم حذف جميع ترجماتها. هذا الإجراء لا يمكن التراجع عنه.',
    'admin.fillRequiredFields': 'يرجى ملء جميع الحقول المطلوبة',
    'admin.fetchError': 'حدث خطأ في جلب البيانات',
    'admin.saveError': 'حدث خطأ في حفظ البيانات',
    'admin.deleteError': 'حدث خطأ في حذف البيانات',
    'admin.themeModeError': 'حدث خطأ في تغيير الوضع',
    
    // Interests
    'interests.title': 'اهتمامات الأندية',
    'interests.subtitle': 'إدارة طلبات الأندية للتواصل مع اللاعبين',
    'interests.totalRequests': 'إجمالي الطلبات',
    'interests.pendingReview': 'قيد المراجعة',
    'interests.contacted': 'تم التواصل',
    'interests.officialOffers': 'عروض رسمية',
    'interests.searchPlaceholder': 'بحث باسم اللاعب أو النادي...',
    'interests.filterByStatus': 'تصفية بالحالة',
    'interests.allStatuses': 'جميع الحالات',
    'interests.pending': 'قيد المراجعة',
    'interests.reviewed': 'تمت المراجعة',
    'interests.rejected': 'مرفوض',
    'interests.noInterests': 'لا توجد طلبات اهتمام',
    'interests.viewDetails': 'عرض التفاصيل',
    'interests.requestDetails': 'تفاصيل طلب الاهتمام',
    'interests.clubInfo': 'معلومات النادي',
    'interests.playerInfo': 'معلومات اللاعب',
    'interests.interestType': 'نوع الاهتمام',
    'interests.currentStatus': 'الحالة الحالية',
    'interests.clubMessage': 'رسالة النادي',
    'interests.adminNotes': 'ملاحظات الإدارة',
    'interests.addNotes': 'أضف ملاحظات...',
    'interests.markContacted': 'تم التواصل',
    'interests.markReviewed': 'تمت المراجعة',
    'interests.reject': 'رفض',
    'interests.offer': 'عرض رسمي',
    'interests.interested': 'مهتم',
    'interests.statusUpdated': 'تم تحديث الحالة بنجاح',
    'interests.updateError': 'حدث خطأ في تحديث الحالة',
    
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
    'consultation.settings': 'إعدادات الاستشارة',
    'consultation.slots': 'المواعيد',
    'consultation.bookings': 'الحجوزات',
    'consultation.serviceActive': 'تفعيل خدمة الاستشارات',
    'consultation.serviceDesc': 'وصف الخدمة',
    'consultation.serviceFee': 'رسوم الخدمة',
    'consultation.currency': 'العملة',
    'consultation.durationMinutes': 'مدة الاستشارة (دقيقة)',
    'consultation.addSlot': 'إضافة موعد',
    'consultation.dayOfWeek': 'اليوم',
    'consultation.startTime': 'وقت البداية',
    'consultation.endTime': 'وقت النهاية',
    'consultation.recurrence': 'التكرار',
    'consultation.weekly': 'أسبوعي',
    'consultation.specific': 'تواريخ محددة',
    'consultation.dateRange': 'نطاق التواريخ',
    'consultation.noBookings': 'لا توجد حجوزات',
    'consultation.confirmBooking': 'تأكيد الحجز',
    'consultation.cancelBooking': 'إلغاء الحجز',
    'consultation.viewProof': 'عرض إثبات الدفع',
    'consultation.meetLink': 'رابط الاجتماع',
    'consultation.generateMeet': 'إنشاء رابط Meet',
    'consultation.paymentPending': 'بانتظار الدفع',
    'consultation.paymentConfirmed': 'تم تأكيد الدفع',
    
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
    'meet.loadError': 'فشل في تحميل سجلات الاجتماعات',
    'meet.logsRefreshed': 'تم تحديث السجلات',
    'meet.statusUpdated': 'تم تحديث الحالة بنجاح',
    'meet.statusUpdateError': 'فشل في تحديث الحالة',
    'meet.bookingDate': 'تاريخ الحجز',
    'meet.bookingTime': 'وقت الحجز',
    
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
    'messages.unread': 'غير مقروءة',
    'messages.all': 'الكل',
    'messages.sendSuccess': 'تم إرسال الرسالة بنجاح',
    'messages.sendError': 'حدث خطأ في إرسال الرسالة',
    
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
    'notifications.viewAll': 'عرض الكل',
    'notifications.new': 'جديد',
    
    // Forms & Validation
    'validation.required': 'هذا الحقل مطلوب',
    'validation.email': 'البريد الإلكتروني غير صالح',
    'validation.minLength': 'الحد الأدنى للأحرف هو',
    'validation.maxLength': 'الحد الأقصى للأحرف هو',
    'validation.passwordMismatch': 'كلمتا المرور غير متطابقتين',
    'validation.invalidUrl': 'الرابط غير صالح',
    'validation.invalidPhone': 'رقم الهاتف غير صالح',
    
    // Upload
    'upload.selectFile': 'اختر ملف',
    'upload.dragDrop': 'أو اسحب وأفلت هنا',
    'upload.uploading': 'جاري الرفع...',
    'upload.success': 'تم الرفع بنجاح',
    'upload.error': 'حدث خطأ أثناء الرفع',
    'upload.invalidType': 'نوع الملف غير مدعوم',
    'upload.sizeLimit': 'حجم الملف يتجاوز الحد المسموح',
    'upload.selectImage': 'اختر صورة',
    'upload.invalidImage': 'يرجى اختيار ملف صورة صالح',
    
    // Days of week
    'days.sunday': 'الأحد',
    'days.monday': 'الإثنين',
    'days.tuesday': 'الثلاثاء',
    'days.wednesday': 'الأربعاء',
    'days.thursday': 'الخميس',
    'days.friday': 'الجمعة',
    'days.saturday': 'السبت',
    
    // Translation Categories
    'category.general': 'عام',
    'category.nav': 'القائمة',
    'category.auth': 'التسجيل والدخول',
    'category.player': 'اللاعبين',
    'category.club': 'الأندية',
    'category.subscription': 'الاشتراكات',
    'category.common': 'مشترك',
    'category.admin': 'لوحة التحكم',
    'category.consultation': 'الاستشارات',
    'category.meet': 'اجتماعات Meet',
    'category.messages': 'الرسائل',
    'category.notifications': 'الإشعارات',
    'category.interests': 'الاهتمامات',
    'category.validation': 'التحقق',
    'category.upload': 'الرفع',
    'category.days': 'أيام الأسبوع',
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
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.update': 'Update',
    'common.details': 'Details',
    'common.info': 'Information',
    'common.unknown': 'Unknown',
    'common.none': 'None',
    'common.selectAll': 'Select All',
    'common.clearAll': 'Clear All',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.description': 'Description',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.notes': 'Notes',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember Me',
    'auth.confirmPassword': 'Confirm Password',
    'auth.newPassword': 'New Password',
    'auth.loginRequired': 'Login required',
    'auth.invalidCredentials': 'Invalid credentials',
    'auth.accountCreated': 'Account created successfully',
    'auth.logoutSuccess': 'Logged out successfully',
    'auth.resetPasswordSent': 'Password reset link sent',
    
    // Subscription
    'subscription.plans': 'Subscription Plans',
    'subscription.subscribe': 'Subscribe Now',
    'subscription.upgrade': 'Upgrade',
    'subscription.current': 'Current Plan',
    'subscription.expired': 'Expired',
    'subscription.cancelled': 'Cancelled',
    'subscription.renew': 'Renew',
    'subscription.autoRenew': 'Auto Renew',
    'subscription.startDate': 'Start Date',
    'subscription.endDate': 'End Date',
    'subscription.daysRemaining': 'Days Remaining',
    'subscription.paymentProof': 'Payment Proof',
    'subscription.activated': 'Subscription activated successfully',
    'subscription.updateError': 'Error updating settings',
    
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
    'player.registrationSuccess': 'Registration submitted successfully! It will be reviewed by the admin.',
    'player.profileImageRequired': 'Profile image is required',
    'player.idDocumentRequired': 'ID document is required',
    'player.maxVideos': 'Maximum 5 videos allowed',
    'player.imageSizeLimit': 'Image size must not exceed 5MB',
    'player.fileSizeLimit': 'File size must not exceed 10MB',
    
    // Club
    'club.dashboard': 'Club Dashboard',
    'club.profile': 'Club Profile',
    'club.favorites': 'Favorites',
    'club.city': 'City',
    'club.country': 'Country',
    'club.website': 'Website',
    'club.phone': 'Phone',
    'club.nameRequired': 'Club name is required',
    'club.emailRequired': 'Email is required',
    'club.logoUploadSuccess': 'Logo uploaded successfully',
    'club.logoUploadError': 'Error uploading logo',
    'club.updateSuccess': 'Changes saved successfully',
    'club.updateError': 'Error saving changes',
    'club.logoSizeLimit': 'Image size must be less than 2MB',
    'club.invalidImage': 'Please select a valid image',
    
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
    'admin.manageLanguages': 'Manage Languages',
    'admin.languagesDesc': 'Add, edit and delete available languages',
    'admin.addLanguage': 'Add New Language',
    'admin.editLanguage': 'Edit Language',
    'admin.languageCode': 'Language Code',
    'admin.languageName': 'Language Name (English)',
    'admin.languageNativeName': 'Language Name (Native)',
    'admin.languageDirection': 'Direction',
    'admin.rtl': 'Right to Left (RTL)',
    'admin.ltr': 'Left to Right (LTR)',
    'admin.defaultLanguage': 'Default Language',
    'admin.activateLanguage': 'Activate Language',
    'admin.translations': 'Translations',
    'admin.translationsFor': 'Translations for',
    'admin.addTranslation': 'Add Translation',
    'admin.translationKey': 'Key',
    'admin.translationValue': 'Translation',
    'admin.translationCategory': 'Category',
    'admin.currentTranslations': 'Current Translations',
    'admin.filterByCategory': 'Filter by Category',
    'admin.allCategories': 'All Categories',
    'admin.noTranslationsInCategory': 'No translations in this category',
    'admin.languageAdded': 'Language added successfully',
    'admin.languageUpdated': 'Language updated successfully',
    'admin.languageDeleted': 'Language deleted successfully',
    'admin.translationAdded': 'Translation saved successfully',
    'admin.translationDeleted': 'Translation deleted',
    'admin.cannotDeleteDefault': 'Cannot delete default language',
    'admin.deleteLanguageConfirm': 'Are you sure you want to delete this language?',
    'admin.deleteLanguageWarning': 'All translations will be deleted. This action cannot be undone.',
    'admin.fillRequiredFields': 'Please fill all required fields',
    'admin.fetchError': 'Error fetching data',
    'admin.saveError': 'Error saving data',
    'admin.deleteError': 'Error deleting data',
    'admin.themeModeError': 'Error changing theme mode',
    
    // Interests
    'interests.title': 'Club Interests',
    'interests.subtitle': 'Manage club requests to contact players',
    'interests.totalRequests': 'Total Requests',
    'interests.pendingReview': 'Pending Review',
    'interests.contacted': 'Contacted',
    'interests.officialOffers': 'Official Offers',
    'interests.searchPlaceholder': 'Search by player or club name...',
    'interests.filterByStatus': 'Filter by Status',
    'interests.allStatuses': 'All Statuses',
    'interests.pending': 'Pending Review',
    'interests.reviewed': 'Reviewed',
    'interests.rejected': 'Rejected',
    'interests.noInterests': 'No interest requests',
    'interests.viewDetails': 'View Details',
    'interests.requestDetails': 'Interest Request Details',
    'interests.clubInfo': 'Club Information',
    'interests.playerInfo': 'Player Information',
    'interests.interestType': 'Interest Type',
    'interests.currentStatus': 'Current Status',
    'interests.clubMessage': 'Club Message',
    'interests.adminNotes': 'Admin Notes',
    'interests.addNotes': 'Add notes...',
    'interests.markContacted': 'Mark Contacted',
    'interests.markReviewed': 'Mark Reviewed',
    'interests.reject': 'Reject',
    'interests.offer': 'Official Offer',
    'interests.interested': 'Interested',
    'interests.statusUpdated': 'Status updated successfully',
    'interests.updateError': 'Error updating status',
    
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
    'consultation.settings': 'Consultation Settings',
    'consultation.slots': 'Slots',
    'consultation.bookings': 'Bookings',
    'consultation.serviceActive': 'Activate Consultation Service',
    'consultation.serviceDesc': 'Service Description',
    'consultation.serviceFee': 'Service Fee',
    'consultation.currency': 'Currency',
    'consultation.durationMinutes': 'Consultation Duration (minutes)',
    'consultation.addSlot': 'Add Slot',
    'consultation.dayOfWeek': 'Day',
    'consultation.startTime': 'Start Time',
    'consultation.endTime': 'End Time',
    'consultation.recurrence': 'Recurrence',
    'consultation.weekly': 'Weekly',
    'consultation.specific': 'Specific Dates',
    'consultation.dateRange': 'Date Range',
    'consultation.noBookings': 'No bookings',
    'consultation.confirmBooking': 'Confirm Booking',
    'consultation.cancelBooking': 'Cancel Booking',
    'consultation.viewProof': 'View Payment Proof',
    'consultation.meetLink': 'Meeting Link',
    'consultation.generateMeet': 'Generate Meet Link',
    'consultation.paymentPending': 'Payment Pending',
    'consultation.paymentConfirmed': 'Payment Confirmed',
    
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
    'meet.loadError': 'Failed to load meeting logs',
    'meet.logsRefreshed': 'Logs refreshed',
    'meet.statusUpdated': 'Status updated successfully',
    'meet.statusUpdateError': 'Failed to update status',
    'meet.bookingDate': 'Booking Date',
    'meet.bookingTime': 'Booking Time',
    
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
    'messages.unread': 'Unread',
    'messages.all': 'All',
    'messages.sendSuccess': 'Message sent successfully',
    'messages.sendError': 'Error sending message',
    
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
    'notifications.viewAll': 'View All',
    'notifications.new': 'New',
    
    // Forms & Validation
    'validation.required': 'This field is required',
    'validation.email': 'Invalid email address',
    'validation.minLength': 'Minimum characters is',
    'validation.maxLength': 'Maximum characters is',
    'validation.passwordMismatch': 'Passwords do not match',
    'validation.invalidUrl': 'Invalid URL',
    'validation.invalidPhone': 'Invalid phone number',
    
    // Upload
    'upload.selectFile': 'Select File',
    'upload.dragDrop': 'or drag and drop here',
    'upload.uploading': 'Uploading...',
    'upload.success': 'Uploaded successfully',
    'upload.error': 'Error uploading',
    'upload.invalidType': 'File type not supported',
    'upload.sizeLimit': 'File size exceeds limit',
    'upload.selectImage': 'Select Image',
    'upload.invalidImage': 'Please select a valid image file',
    
    // Days of week
    'days.sunday': 'Sunday',
    'days.monday': 'Monday',
    'days.tuesday': 'Tuesday',
    'days.wednesday': 'Wednesday',
    'days.thursday': 'Thursday',
    'days.friday': 'Friday',
    'days.saturday': 'Saturday',
    
    // Translation Categories
    'category.general': 'General',
    'category.nav': 'Navigation',
    'category.auth': 'Authentication',
    'category.player': 'Players',
    'category.club': 'Clubs',
    'category.subscription': 'Subscriptions',
    'category.common': 'Common',
    'category.admin': 'Admin Panel',
    'category.consultation': 'Consultations',
    'category.meet': 'Meet Meetings',
    'category.messages': 'Messages',
    'category.notifications': 'Notifications',
    'category.interests': 'Interests',
    'category.validation': 'Validation',
    'category.upload': 'Upload',
    'category.days': 'Days of Week',
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
