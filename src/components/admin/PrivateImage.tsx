import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ImageOff, ExternalLink } from 'lucide-react';

interface PrivateImageProps {
  bucket: string;
  url: string | null;
  alt: string;
  className?: string;
  showLink?: boolean;
}

/**
 * Component to display images from private storage buckets using signed URLs
 */
const PrivateImage = ({ bucket, url, alt, className = '', showLink = true }: PrivateImageProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(false);

      try {
        // Extract the actual path from the full URL
        let filePath = url;
        
        // Handle full URLs from getPublicUrl
        if (url.includes('/storage/v1/object/public/')) {
          const parts = url.split('/storage/v1/object/public/');
          if (parts[1]) {
            const bucketAndPath = parts[1];
            const slashIndex = bucketAndPath.indexOf('/');
            if (slashIndex > -1) {
              filePath = bucketAndPath.substring(slashIndex + 1);
            }
          }
        }

        // Decode URI components in case path is encoded
        filePath = decodeURIComponent(filePath);

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError) {
          console.error('Error creating signed URL:', signError);
          setError(true);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [bucket, url]);

  if (!url) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-secondary rounded-lg ${className}`} style={{ minHeight: '100px' }}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-secondary rounded-lg p-4 ${className}`} style={{ minHeight: '100px' }}>
        <ImageOff className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">تعذر تحميل الصورة</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <a 
        href={signedUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <img 
          src={signedUrl} 
          alt={alt} 
          className={`rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity ${className}`}
          onError={() => setError(true)}
        />
      </a>
      {showLink && (
        <a 
          href={signedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-gold hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          فتح في نافذة جديدة
        </a>
      )}
    </div>
  );
};

export default PrivateImage;
