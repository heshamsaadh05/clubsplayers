import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Package,
  Settings,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Languages,
  Palette,
  Footprints,
  Layers,
  Share2,
  Search,
  Globe,
  Heart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isOpen: externalIsOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const { t, direction, languages, currentLanguage, setLanguage } = useLanguage();
  const isRTL = direction === 'rtl';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with external control
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setMobileOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const menuItems = [
    { icon: LayoutDashboard, labelKey: 'admin.dashboard', path: '/admin', keywords: ['dashboard', 'الرئيسية', 'home'] },
    { icon: Users, labelKey: 'admin.players', path: '/admin/players', keywords: ['players', 'لاعب'] },
    { icon: Building2, labelKey: 'admin.clubs', path: '/admin/clubs', keywords: ['clubs', 'نادي', 'فريق'] },
    { icon: Heart, label: 'اهتمامات الأندية', path: '/admin/interests', keywords: ['interests', 'اهتمام', 'عرض', 'طلب'] },
    { icon: Receipt, labelKey: 'admin.subscriptions', path: '/admin/subscriptions', keywords: ['subscriptions', 'اشتراك'] },
    { icon: Package, labelKey: 'admin.plans', path: '/admin/plans', keywords: ['plans', 'باقة', 'خطة'] },
    { icon: CreditCard, labelKey: 'admin.payments', path: '/admin/payments', keywords: ['payments', 'دفع', 'فلوس'] },
    { icon: FileText, labelKey: 'admin.pages', path: '/admin/pages', keywords: ['pages', 'صفحة'] },
    { icon: Menu, labelKey: 'admin.menus', path: '/admin/menus', keywords: ['menus', 'قائمة', 'navigation'] },
    { icon: Languages, labelKey: 'admin.languages', path: '/admin/languages', keywords: ['languages', 'لغة', 'ترجمة'] },
    { icon: Palette, labelKey: 'admin.design', path: '/admin/design', keywords: ['design', 'ألوان', 'تصميم', 'ثيم'] },
    { icon: Layers, labelKey: 'admin.sections', path: '/admin/sections', keywords: ['sections', 'قسم', 'أقسام'] },
    { icon: Footprints, labelKey: 'admin.footer', path: '/admin/footer', keywords: ['footer', 'تذييل'] },
    { icon: Share2, labelKey: 'admin.social', path: '/admin/footer?tab=social', keywords: ['social', 'تواصل', 'فيسبوك', 'تويتر'] },
    { icon: Settings, labelKey: 'admin.settings', path: '/admin/settings', keywords: ['settings', 'إعداد', 'ضبط'] },
  ];

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter(item => {
      const label = item.labelKey ? t(item.labelKey) : (item as any).label || '';
      return label.toLowerCase().includes(query) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(query));
    });
  }, [searchQuery, t]);

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
      onClose?.();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (isMobile) {
      setMobileOpen(false);
      onClose?.();
    }
  };

  // Language Switcher Component
  const LanguageSwitcher = ({ collapsed = false }: { collapsed?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={`${collapsed ? 'w-10 h-10' : 'gap-2'} hover:bg-secondary`}
        >
          <Globe className="w-4 h-4" />
          {!collapsed && (
            <span className="text-sm">{currentLanguage?.native_name || 'العربية'}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${currentLanguage?.code === lang.code ? 'bg-secondary' : ''}`}
          >
            <span className={lang.direction === 'rtl' ? 'font-arabic' : ''}>
              {lang.native_name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  // Mobile Sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => {
                setMobileOpen(false);
                onClose?.();
              }}
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 h-screen w-72 bg-card border-border z-50 flex flex-col ${
                isRTL ? 'right-0 border-l' : 'left-0 border-r'
              }`}
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
                <span className="text-lg font-bold text-gradient-gold font-playfair">
                  {t('admin.dashboard')}
                </span>
                <div className="flex items-center gap-1">
                  <LanguageSwitcher />
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onClose?.();
                    }}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-border flex-shrink-0">
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    type="text"
                    placeholder={t('admin.quickSearch')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`h-9 text-sm bg-secondary/50 ${isRTL ? 'pr-9' : 'pl-9'}`}
                  />
                </div>
              </div>

              {/* Navigation - Scrollable */}
              <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gold text-primary-foreground'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.labelKey ? t(item.labelKey) : (item as any).label}</span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    {t('common.noResults')}
                  </p>
                )}
              </nav>

              {/* Footer - Fixed at bottom */}
              <div className="p-3 border-t border-border bg-card flex-shrink-0">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-secondary transition-colors mb-2"
                >
                  {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <span>{t('admin.backToSite')}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t('admin.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Sidebar
  return (
    <motion.aside
      initial={{ x: isRTL ? 100 : -100 }}
      animate={{ x: 0 }}
      className={`fixed top-0 h-screen bg-card border-border z-50 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        {!isCollapsed && (
          <span className="text-xl font-bold text-gradient-gold font-playfair">
            {t('admin.dashboard')}
          </span>
        )}
        <div className="flex items-center gap-1">
          <LanguageSwitcher collapsed={isCollapsed} />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : (isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />)}
          </button>
        </div>
      </div>

      {/* Search - Only when not collapsed */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              type="text"
              placeholder={t('admin.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-9 text-sm bg-secondary/50 ${isRTL ? 'pr-9' : 'pl-9'}`}
            />
          </div>
        </div>
      )}

      {/* Navigation - Scrollable */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gold text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.labelKey ? t(item.labelKey) : (item as any).label}</span>}
              </Link>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            {t('common.noResults')}
          </p>
        )}
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-secondary transition-colors mb-2"
        >
          {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {!isCollapsed && <span>{t('admin.backToSite')}</span>}
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>{t('admin.logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
