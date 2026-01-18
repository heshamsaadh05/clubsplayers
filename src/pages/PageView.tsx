import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { logError } from '@/lib/errorLogger';

type Page = Tables<'pages'>;

const PageView = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setNotFound(true);
        } else {
          setPage(data);
        }
      } catch (error) {
        logError(error, 'PageView:fetchPage');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  // Check if content is HTML (from rich text editor) or plain text
  const isHtmlContent = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  // Sanitize HTML content to prevent XSS attacks
  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
            <p className="text-muted-foreground mb-6">
              الصفحة التي تبحث عنها غير موجودة أو تم حذفها
            </p>
            <Button onClick={() => navigate('/')}>
              <ChevronLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = page?.title_ar || page?.title;
  const content = page?.content_ar || page?.content;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4 ml-2" />
            رجوع
          </Button>

          {/* Page Content */}
          <Card>
            <CardContent className="p-6 sm:p-10">
              <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gold">
                {title}
              </h1>

              {content ? (
                isHtmlContent(content) ? (
                  <div 
                    className="prose prose-lg prose-invert max-w-none text-foreground
                      prose-headings:text-foreground prose-p:text-foreground/90
                      prose-strong:text-foreground prose-a:text-gold
                      prose-li:text-foreground/90 prose-blockquote:border-gold
                      prose-blockquote:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                ) : (
                  <div className="prose prose-lg max-w-none text-foreground whitespace-pre-wrap">
                    {content}
                  </div>
                )
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  لا يوجد محتوى لهذه الصفحة
                </p>
              )}
            </CardContent>
          </Card>

          {/* Last Updated */}
          {page && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              آخر تحديث:{' '}
              {new Date(page.updated_at).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PageView;
