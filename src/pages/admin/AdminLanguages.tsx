import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Globe, Languages, Save, Search, RefreshCw } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

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

interface TranslationEdit {
  key: string;
  value: string;
  originalValue: string;
  englishValue: string;
  category: string;
  id?: string;
}

const TRANSLATION_CATEGORIES = [
  { id: 'general', label: 'عام', labelEn: 'General' },
  { id: 'nav', label: 'القائمة', labelEn: 'Navigation' },
  { id: 'auth', label: 'التسجيل والدخول', labelEn: 'Authentication' },
  { id: 'player', label: 'اللاعبين', labelEn: 'Players' },
  { id: 'club', label: 'الأندية', labelEn: 'Clubs' },
  { id: 'subscription', label: 'الاشتراكات', labelEn: 'Subscriptions' },
  { id: 'common', label: 'مشترك', labelEn: 'Common' },
  { id: 'admin', label: 'لوحة التحكم', labelEn: 'Admin Panel' },
  { id: 'consultation', label: 'الاستشارات', labelEn: 'Consultations' },
  { id: 'meet', label: 'اجتماعات Meet', labelEn: 'Meet Logs' },
  { id: 'messages', label: 'الرسائل', labelEn: 'Messages' },
  { id: 'notifications', label: 'الإشعارات', labelEn: 'Notifications' },
  { id: 'interests', label: 'الاهتمامات', labelEn: 'Interests' },
  { id: 'validation', label: 'التحقق', labelEn: 'Validation' },
  { id: 'upload', label: 'الرفع', labelEn: 'Upload' },
  { id: 'days', label: 'أيام الأسبوع', labelEn: 'Days of Week' },
  { id: 'category', label: 'التصنيفات', labelEn: 'Categories' },
];

// Default translations for reference
const defaultEnglishTranslations: Record<string, string> = {
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
  'player.registrationSuccess': 'Registration submitted successfully!',
  'player.profileImageRequired': 'Profile image is required',
  'player.idDocumentRequired': 'ID document is required',
  'player.maxVideos': 'Maximum 5 videos allowed',
  'player.imageSizeLimit': 'Image must be less than 5MB',
  'player.fileSizeLimit': 'File must be less than 10MB',
  
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
  'club.logoSizeLimit': 'Image must be less than 2MB',
  'club.invalidImage': 'Please select a valid image',
  
  // Admin
  'admin.dashboard': 'Dashboard',
  'admin.overview': 'Site statistics overview',
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
  'admin.playerInterests': 'Player Interests',
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
  'consultation.serviceActive': 'Enable Consultation Service',
  'consultation.serviceDesc': 'Service Description',
  'consultation.serviceFee': 'Service Fee',
  'consultation.currency': 'Currency',
  'consultation.durationMinutes': 'Duration (minutes)',
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
  'meet.regenerateCount': 'Regenerate Count',
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
  'notifications.subscriptionExpiring': 'Subscription Expiring',
  'notifications.playerApproved': 'Profile Approved',
  'notifications.playerRejected': 'Profile Rejected',
  'notifications.interestReceived': 'New Interest from Club',
  'notifications.viewAll': 'View All',
  'notifications.new': 'New',
  
  // Validation
  'validation.required': 'This field is required',
  'validation.email': 'Invalid email address',
  'validation.minLength': 'Minimum characters required',
  'validation.maxLength': 'Maximum characters allowed',
  'validation.passwordMismatch': 'Passwords do not match',
  'validation.invalidUrl': 'Invalid URL',
  'validation.invalidPhone': 'Invalid phone number',
  
  // Upload
  'upload.selectFile': 'Select File',
  'upload.dragDrop': 'or drag and drop here',
  'upload.uploading': 'Uploading...',
  'upload.success': 'Upload successful',
  'upload.error': 'Upload error',
  'upload.invalidType': 'File type not supported',
  'upload.sizeLimit': 'File size exceeds limit',
  'upload.selectImage': 'Select Image',
  'upload.invalidImage': 'Please select a valid image file',
  
  // Days
  'days.sunday': 'Sunday',
  'days.monday': 'Monday',
  'days.tuesday': 'Tuesday',
  'days.wednesday': 'Wednesday',
  'days.thursday': 'Thursday',
  'days.friday': 'Friday',
  'days.saturday': 'Saturday',
  
  // Categories
  'category.general': 'General',
  'category.nav': 'Navigation',
  'category.auth': 'Authentication',
  'category.player': 'Players',
  'category.club': 'Clubs',
  'category.subscription': 'Subscriptions',
  'category.common': 'Common',
  'category.admin': 'Admin Panel',
  'category.consultation': 'Consultations',
  'category.meet': 'Meet Logs',
  'category.messages': 'Messages',
  'category.notifications': 'Notifications',
  'category.interests': 'Interests',
  'category.validation': 'Validation',
  'category.upload': 'Upload',
  'category.days': 'Days of Week',
};

const AdminLanguages = () => {
  const { t, direction } = useLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [translationEdits, setTranslationEdits] = useState<Record<string, TranslationEdit>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr' as 'ltr' | 'rtl',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslations(selectedLanguage.code);
    }
  }, [selectedLanguage]);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      const langs = (data || []) as Language[];
      setLanguages(langs);
      
      // Auto-select first language
      if (langs.length > 0 && !selectedLanguage) {
        setSelectedLanguage(langs[0]);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error(t('admin.fetchError'));
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
        .order('key', { ascending: true });

      if (error) throw error;
      setTranslations(data || []);
      
      // Initialize edits from translations
      const edits: Record<string, TranslationEdit> = {};
      (data || []).forEach((t: Translation) => {
        edits[t.key] = {
          key: t.key,
          value: t.value,
          originalValue: t.value,
          englishValue: defaultEnglishTranslations[t.key] || t.key,
          category: t.category,
          id: t.id,
        };
      });
      
      // Add default keys that don't exist yet
      Object.keys(defaultEnglishTranslations).forEach(key => {
        if (!edits[key]) {
          const category = key.split('.')[0] || 'general';
          edits[key] = {
            key,
            value: '',
            originalValue: '',
            englishValue: defaultEnglishTranslations[key],
            category,
          };
        }
      });
      
      setTranslationEdits(edits);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error(t('admin.fetchError'));
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.native_name) {
      toast.error(t('admin.fillRequiredFields'));
      return;
    }

    try {
      if (editingLanguage) {
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
          .eq('id', editingLanguage.id);

        if (error) throw error;
        toast.success(t('admin.languageUpdated'));
      } else {
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
        toast.success(t('admin.languageAdded'));
      }

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
      toast.error(error.message || t('admin.saveError'));
    }
  };

  const handleDelete = async () => {
    if (!editingLanguage) return;

    if (editingLanguage.is_default) {
      toast.error(t('admin.cannotDeleteDefault'));
      return;
    }

    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', editingLanguage.id);

      if (error) throw error;

      toast.success(t('admin.languageDeleted'));
      setDeleteDialogOpen(false);
      setEditingLanguage(null);
      
      // Reset selected language if deleted
      if (selectedLanguage?.id === editingLanguage.id) {
        setSelectedLanguage(null);
      }
      
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error(t('admin.deleteError'));
    }
  };

  const handleSaveTranslations = async () => {
    if (!selectedLanguage) return;
    
    setSaving(true);
    try {
      // Get changed translations
      const changedTranslations = Object.values(translationEdits).filter(
        edit => edit.value !== edit.originalValue && edit.value.trim() !== ''
      );
      
      if (changedTranslations.length === 0) {
        toast.info('لا توجد تغييرات لحفظها');
        setSaving(false);
        return;
      }

      // Upsert all changed translations
      const upsertData = changedTranslations.map(edit => ({
        language_code: selectedLanguage.code,
        key: edit.key,
        value: edit.value,
        category: edit.category,
      }));

      const { error } = await supabase
        .from('translations')
        .upsert(upsertData, { onConflict: 'language_code,key' });

      if (error) throw error;

      toast.success(`تم حفظ ${changedTranslations.length} ترجمة بنجاح`);
      fetchTranslations(selectedLanguage.code);
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error(t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (key: string, value: string) => {
    setTranslationEdits(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const openEditDialog = (language: Language) => {
    setEditingLanguage(language);
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

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      native_name: '',
      direction: 'ltr',
      is_active: true,
      is_default: false,
    });
    setEditingLanguage(null);
    setDialogOpen(false);
  };

  // Filter translations based on search and category
  const filteredTranslations = useMemo(() => {
    let items = Object.values(translationEdits);
    
    if (selectedCategory !== 'all') {
      items = items.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(t => 
        t.key.toLowerCase().includes(query) ||
        t.value.toLowerCase().includes(query) ||
        t.englishValue.toLowerCase().includes(query)
      );
    }
    
    return items.sort((a, b) => a.key.localeCompare(b.key));
  }, [translationEdits, selectedCategory, searchQuery]);

  // Count changed translations
  const changedCount = useMemo(() => {
    return Object.values(translationEdits).filter(
      edit => edit.value !== edit.originalValue && edit.value.trim() !== ''
    ).length;
  }, [translationEdits]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.manageLanguages')}</h1>
            <p className="text-muted-foreground">{t('admin.languagesDesc')}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="btn-gold">
            <Plus className="w-4 h-4 ml-2" />
            {t('admin.addLanguage')}
          </Button>
        </div>

        {/* Languages Tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Language Selector */}
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <Button
                  key={language.id}
                  variant={selectedLanguage?.id === language.id ? 'default' : 'outline'}
                  className={selectedLanguage?.id === language.id ? 'btn-gold' : ''}
                  onClick={() => setSelectedLanguage(language)}
                >
                  <Globe className="w-4 h-4 ml-2" />
                  {language.native_name}
                  {language.is_default && (
                    <Badge className="mr-2 text-xs" variant="secondary">افتراضية</Badge>
                  )}
                </Button>
              ))}
            </div>

            {selectedLanguage && (
              <>
                {/* Language Direction Toggle */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Languages className="w-5 h-5 text-gold" />
                        <span className="font-medium">اتجاه اللغة:</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedLanguage.direction === 'ltr' ? 'default' : 'outline'}
                          size="sm"
                          className={selectedLanguage.direction === 'ltr' ? 'bg-primary' : ''}
                          onClick={() => openEditDialog({ ...selectedLanguage, direction: 'ltr' })}
                        >
                          LTR (Left to Right)
                        </Button>
                        <Button
                          variant={selectedLanguage.direction === 'rtl' ? 'default' : 'outline'}
                          size="sm"
                          className={selectedLanguage.direction === 'rtl' ? 'bg-primary' : ''}
                          onClick={() => openEditDialog({ ...selectedLanguage, direction: 'rtl' })}
                        >
                          RTL (Right to Left)
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(selectedLanguage)}
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل اللغة
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الترجمات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
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
                  <Button
                    variant="outline"
                    onClick={() => fetchTranslations(selectedLanguage.code)}
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    تحديث
                  </Button>
                </div>

                {/* Translations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTranslations.map((translation) => (
                    <div
                      key={translation.key}
                      className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:border-gold/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-bold text-primary truncate">
                            {translation.key}
                          </code>
                          {translation.value !== translation.originalValue && translation.value.trim() !== '' && (
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                              معدّل
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          En: {translation.englishValue}
                        </p>
                      </div>
                      <div className="w-64">
                        <Input
                          value={translation.value}
                          onChange={(e) => updateTranslation(translation.key, e.target.value)}
                          placeholder={translation.englishValue}
                          className="text-sm"
                          dir={selectedLanguage.direction}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTranslations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Languages className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد ترجمات مطابقة</p>
                  </div>
                )}

                {/* Save Button */}
                <div className="sticky bottom-4 flex justify-center">
                  <Button
                    onClick={handleSaveTranslations}
                    disabled={saving || changedCount === 0}
                    className="btn-gold px-8 py-3 text-lg shadow-lg"
                    size="lg"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                    ) : (
                      <Save className="w-5 h-5 ml-2" />
                    )}
                    حفظ التغييرات
                    {changedCount > 0 && (
                      <Badge className="mr-2 bg-white text-gold">
                        {changedCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add/Edit Language Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingLanguage ? t('admin.editLanguage') : t('admin.addLanguage')}
              </DialogTitle>
              <DialogDescription>
                أدخل بيانات اللغة أدناه
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('admin.languageCode')} *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="ar"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direction">{t('admin.languageDirection')}</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value: 'ltr' | 'rtl') => setFormData({ ...formData, direction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtl">{t('admin.rtl')}</SelectItem>
                      <SelectItem value="ltr">{t('admin.ltr')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.languageName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Arabic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="native_name">{t('admin.languageNativeName')} *</Label>
                <Input
                  id="native_name"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  placeholder="العربية"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t('admin.activateLanguage')}</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">{t('admin.defaultLanguage')}</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              {editingLanguage && !editingLanguage.is_default && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(false);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف
                </Button>
              )}
              <Button variant="outline" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} className="btn-gold">
                {editingLanguage ? t('common.update') : t('common.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.deleteLanguageConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف اللغة "{editingLanguage?.native_name}" وجميع ترجماتها. {t('admin.deleteLanguageWarning')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLanguages;
