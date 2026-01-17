import { useState, useEffect } from 'react';
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
  Languages
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

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

  // Sync with external control
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setMobileOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
    { icon: Users, label: 'اللاعبون', path: '/admin/players' },
    { icon: Building2, label: 'الأندية', path: '/admin/clubs' },
    { icon: Receipt, label: 'الاشتراكات', path: '/admin/subscriptions' },
    { icon: Package, label: 'باقات الاشتراك', path: '/admin/plans' },
    { icon: CreditCard, label: 'وسائل الدفع', path: '/admin/payments' },
    { icon: FileText, label: 'الصفحات', path: '/admin/pages' },
    { icon: Menu, label: 'القوائم', path: '/admin/menus' },
    { icon: Languages, label: 'اللغات', path: '/admin/languages' },
    { icon: Settings, label: 'الإعدادات', path: '/admin/settings' },
  ];

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
              className="fixed right-0 top-0 h-screen w-72 bg-card border-l border-border z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
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

              {/* Navigation */}
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => {
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
                })}
              </nav>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card">
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
      className={`fixed right-0 top-0 h-screen bg-card border-l border-border z-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border">
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

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
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
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
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
