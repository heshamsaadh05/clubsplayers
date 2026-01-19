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
  Receipt,
  Languages,
  Palette,
  Footprints,
  Layers,
  Share2,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isOpen: externalIsOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
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
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin', keywords: ['dashboard', 'الرئيسية', 'home'] },
    { icon: Users, label: 'اللاعبون', path: '/admin/players', keywords: ['players', 'لاعب'] },
    { icon: Building2, label: 'الأندية', path: '/admin/clubs', keywords: ['clubs', 'نادي', 'فريق'] },
    { icon: Receipt, label: 'الاشتراكات', path: '/admin/subscriptions', keywords: ['subscriptions', 'اشتراك'] },
    { icon: Package, label: 'باقات الاشتراك', path: '/admin/plans', keywords: ['plans', 'باقة', 'خطة'] },
    { icon: CreditCard, label: 'وسائل الدفع', path: '/admin/payments', keywords: ['payments', 'دفع', 'فلوس'] },
    { icon: FileText, label: 'الصفحات', path: '/admin/pages', keywords: ['pages', 'صفحة'] },
    { icon: Menu, label: 'القوائم', path: '/admin/menus', keywords: ['menus', 'قائمة', 'navigation'] },
    { icon: Languages, label: 'اللغات', path: '/admin/languages', keywords: ['languages', 'لغة', 'ترجمة'] },
    { icon: Palette, label: 'التصميم', path: '/admin/design', keywords: ['design', 'ألوان', 'تصميم', 'ثيم'] },
    { icon: Layers, label: 'السيكشنز', path: '/admin/sections', keywords: ['sections', 'قسم', 'أقسام'] },
    { icon: Footprints, label: 'الفوتر', path: '/admin/footer', keywords: ['footer', 'تذييل'] },
    { icon: Share2, label: 'التواصل الاجتماعي', path: '/admin/footer?tab=social', keywords: ['social', 'تواصل', 'فيسبوك', 'تويتر'] },
    { icon: Settings, label: 'الإعدادات', path: '/admin/settings', keywords: ['settings', 'إعداد', 'ضبط'] },
  ];

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [searchQuery]);

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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-72 bg-card border-l border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
                <span className="text-lg font-bold text-gradient-gold font-playfair">
                  لوحة التحكم
                </span>
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

              {/* Search */}
              <div className="px-3 py-2 border-b border-border flex-shrink-0">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="بحث سريع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 h-9 text-sm bg-secondary/50"
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
                        <span>{item.label}</span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    لا توجد نتائج
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
                  <ChevronLeft className="w-5 h-5" />
                  <span>العودة للموقع</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
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
      initial={{ x: 100 }}
      animate={{ x: 0 }}
      className={`fixed right-0 top-0 h-screen bg-card border-l border-border z-50 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        {!isCollapsed && (
          <span className="text-xl font-bold text-gradient-gold font-playfair">
            لوحة التحكم
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Search - Only when not collapsed */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="بحث سريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-9 text-sm bg-secondary/50"
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
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            لا توجد نتائج
          </p>
        )}
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-secondary transition-colors mb-2"
        >
          <ChevronLeft className="w-5 h-5" />
          {!isCollapsed && <span>العودة للموقع</span>}
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
