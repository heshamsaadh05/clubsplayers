import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import MessagesInbox from '@/components/messages/MessagesInbox';

const Messages = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/messages');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              رجوع
            </Button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">الرسائل</h1>
                <p className="text-muted-foreground">تواصل مع الأندية واللاعبين</p>
              </div>
            </div>
          </motion.div>

          {/* Messages Inbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass rounded-2xl p-6"
          >
            <MessagesInbox />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;