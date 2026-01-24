import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Building2, LogIn, LogOut, LayoutDashboard, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePublishedPages } from "@/hooks/usePublishedPages";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { useThemeMode } from "@/hooks/useThemeMode";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    user,
    roles,
    signOut,
    loading
  } = useAuth();
  const {
    t,
    direction
  } = useLanguage();
  const {
    pages: publishedPages
  } = usePublishedPages();
  const { data: headerMenuItems = [] } = useMenuItems('header');
  const { currentLanguage } = useLanguage();
  const { logo, siteName: siteNameSettings, getLogoForMode, logoSizeClass } = useSiteLogo();
  const { resolvedTheme } = useThemeMode();
  const isDarkMode = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'player' | 'club' | 'admin' | null>(null);
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        setUserType(null);
        return;
      }

      // Check admin first
      if (roles.includes('admin')) {
        setUserType('admin');
        return;
      }

      // Check if player
      const {
        data: playerData
      } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
      if (playerData) {
        setUserType('player');
        return;
      }

      // Check if club
      const {
        data: clubData
      } = await supabase.from('clubs').select('id').eq('user_id', user.id).maybeSingle();
      if (clubData) {
        setUserType('club');
        return;
      }
      setUserType(null);
    };
    if (!loading) {
      checkUserType();
    }
  }, [user, roles, loading]);
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };
  const getDashboardLink = () => {
    switch (userType) {
      case 'admin':
        return '/admin';
      case 'player':
        return '/player-dashboard';
      case 'club':
        return '/club-dashboard';
      default:
        return '/auth';
    }
  };
  // Use dynamic menu items from database
  const navLinks = headerMenuItems.map(item => ({
    name: currentLanguage?.code === 'en' ? item.title : (item.title_ar || item.title),
    href: item.url,
    isExternal: item.is_external,
  }));
  return <motion.nav initial={{
    y: -100
  }} animate={{
    y: 0
  }} className="fixed top-0 right-0 left-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div whileHover={{
          scale: 1.05
        }}>
            <Link to="/" className="flex items-center">
              {logo.type === 'image' && getLogoForMode(isDarkMode) ? (
                <img 
                  src={getLogoForMode(isDarkMode)!} 
                  alt={siteNameSettings.ar || siteNameSettings.en || 'Logo'} 
                  className={`${logoSizeClass} w-auto object-contain`}
                />
              ) : (
                <span className="text-2xl font-bold text-gradient-gold font-playfair">
                  {currentLanguage?.code === 'en' 
                    ? (siteNameSettings.en || 'Stars Agency')
                    : (siteNameSettings.ar || siteNameSettings.en || 'Stars Agency')}
                </span>
              )}
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => 
              link.isExternal ? (
                <motion.a 
                  key={link.name} 
                  href={link.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-gold transition-colors font-medium" 
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                </motion.a>
              ) : link.href.startsWith('#') ? (
                <motion.a 
                  key={link.name} 
                  href={link.href} 
                  className="text-foreground/80 hover:text-gold transition-colors font-medium" 
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                </motion.a>
              ) : (
                <Link key={link.name} to={link.href}>
                  <motion.span 
                    className="text-foreground/80 hover:text-gold transition-colors font-medium block" 
                    whileHover={{ y: -2 }}
                  >
                    {link.name}
                  </motion.span>
                </Link>
              )
            )}

            {/* Published Pages Dropdown */}
            {publishedPages.length > 0 && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button className="text-foreground/80 hover:text-gold transition-colors font-medium flex items-center gap-1" whileHover={{
                y: -2
              }}>
                    <FileText className="w-4 h-4" />
                    {t('nav.pages', 'صفحات')}
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  {publishedPages.map(page => <DropdownMenuItem key={page.id} asChild>
                      <Link to={`/page/${page.slug}`} className="w-full">
                        {currentLanguage?.code === 'en' 
                          ? (page.title || page.title_ar) 
                          : (page.title_ar || page.title)}
                      </Link>
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeModeToggle />
            <LanguageSwitcher />
            {user ? <>
                <NotificationBell />
                <Button variant="outline" className="border-gold/30 hover:bg-gold/10" asChild>
                  <Link to={getDashboardLink()}>
                    <LayoutDashboard className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.dashboard', 'لوحة التحكم')}
                  </Link>
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-gold" asChild>
                  <Link to="/account-settings">
                    <Settings className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.settings', 'الإعدادات')}
                  </Link>
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
                  <LogOut className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  {t('nav.logout', 'خروج')}
                </Button>
              </> : <>
                <Button variant="ghost" className="text-foreground hover:text-gold hover:bg-gold/10" asChild>
                  <Link to="/auth">
                    <LogIn className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.login', 'تسجيل دخول')}
                  </Link>
                </Button>
                <Button variant="outline" className="border-gold/30 hover:bg-gold/10" asChild>
                  <Link to="/auth?type=player">
                    <User className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.registerPlayer', 'تسجيل لاعب')}
                  </Link>
                </Button>
                <Button className="btn-gold rounded-full px-6" asChild>
                  <Link to="/auth?type=club">
                    <Building2 className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.joinClub', 'انضمام نادي')}
                  </Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-foreground p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} exit={{
        opacity: 0,
        height: 0
      }} className="lg:hidden bg-card border-t border-border">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map(link => 
                link.isExternal ? (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-foreground/80 hover:text-gold transition-colors py-2" 
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : link.href.startsWith('#') ? (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="block text-foreground/80 hover:text-gold transition-colors py-2" 
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    key={link.name} 
                    to={link.href} 
                    className="block text-foreground/80 hover:text-gold transition-colors py-2" 
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              )}

              {/* Published Pages - Mobile */}
              {publishedPages.length > 0 && <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">{t('nav.pages', 'صفحات')}</p>
                  {publishedPages.map(page => <Link key={page.id} to={`/page/${page.slug}`} className="block text-foreground/80 hover:text-gold transition-colors py-2 pr-4" onClick={() => setIsOpen(false)}>
                      {currentLanguage?.code === 'en' 
                        ? (page.title || page.title_ar) 
                        : (page.title_ar || page.title)}
                    </Link>)}
                </div>}
              <div className="pt-4 space-y-3 border-t border-border">
                {user ? <>
                    <Button variant="outline" className="w-full justify-start border-gold/30" asChild>
                      <Link to={getDashboardLink()} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 ml-2" />
                        لوحة التحكم
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-gold" asChild>
                      <Link to="/account-settings" onClick={() => setIsOpen(false)}>
                        <Settings className="w-4 h-4 ml-2" />
                        إعدادات الحساب
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </> : <>
                    <Button variant="ghost" className="w-full justify-start text-foreground hover:text-gold" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <LogIn className="w-4 h-4 ml-2" />
                        تسجيل دخول
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-gold/30" asChild>
                      <Link to="/auth?type=player" onClick={() => setIsOpen(false)}>
                        <User className="w-4 h-4 ml-2" />
                        تسجيل لاعب
                      </Link>
                    </Button>
                    <Button className="w-full btn-gold rounded-full" asChild>
                      <Link to="/auth?type=club" onClick={() => setIsOpen(false)}>
                        <Building2 className="w-4 h-4 ml-2" />
                        انضمام نادي
                      </Link>
                    </Button>
                  </>}
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </motion.nav>;
};
export default Navbar;