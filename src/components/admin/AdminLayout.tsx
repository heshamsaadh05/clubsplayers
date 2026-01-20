import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      navigate('/');
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
          <span className="text-lg font-bold text-gradient-gold font-playfair">
            {t('admin.dashboard')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </header>
      )}
      
      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ${
        isMobile 
          ? 'pt-20 px-4 pb-6' 
          : isRTL ? 'mr-64 p-8' : 'ml-64 p-8'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
