import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/notifications/NotificationBell";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: "الرئيسية", href: "#home" },
    { name: "خدماتنا", href: "#services" },
    { name: "اللاعبون", href: "#players" },
    { name: "عن الوكالة", href: "#about" },
    { name: "تواصل معنا", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 right-0 left-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.a
            href="#"
            className="text-2xl font-bold text-gradient-gold font-playfair"
            whileHover={{ scale: 1.05 }}
          >
            ستارز إيجنسي
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                className="text-foreground/80 hover:text-gold transition-colors font-medium"
                whileHover={{ y: -2 }}
              >
                {link.name}
              </motion.a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {user && <NotificationBell />}
            <Button
              variant="ghost"
              className="text-foreground hover:text-gold hover:bg-gold/10"
              asChild
            >
              <Link to="/player-registration">
                <User className="w-4 h-4 ml-2" />
                تسجيل لاعب
              </Link>
            </Button>
            <Button className="btn-gold rounded-full px-6" asChild>
              <Link to="/club-registration">
                <Building2 className="w-4 h-4 ml-2" />
                انضمام نادي
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-foreground/80 hover:text-gold transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-3 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:text-gold"
                  asChild
                >
                  <Link to="/player-registration" onClick={() => setIsOpen(false)}>
                    <User className="w-4 h-4 ml-2" />
                    تسجيل لاعب
                  </Link>
                </Button>
                <Button className="w-full btn-gold rounded-full" asChild>
                  <Link to="/club-registration" onClick={() => setIsOpen(false)}>
                    <Building2 className="w-4 h-4 ml-2" />
                    انضمام نادي
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
