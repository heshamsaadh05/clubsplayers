import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
    { icon: Users, label: 'اللاعبون', path: '/admin/players' },
    { icon: Building2, label: 'الأندية', path: '/admin/clubs' },
    { icon: Package, label: 'باقات الاشتراك', path: '/admin/plans' },
    { icon: CreditCard, label: 'وسائل الدفع', path: '/admin/payments' },
    { icon: FileText, label: 'الصفحات', path: '/admin/pages' },
    { icon: Settings, label: 'الإعدادات', path: '/admin/settings' },
  ];

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
