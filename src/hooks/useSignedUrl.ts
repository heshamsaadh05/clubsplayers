import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get a signed URL for private storage files
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export const useSignedUrl = (bucket: string, path: string | null, expiresIn: number = 3600) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract the actual path from the full URL if needed
        let filePath = path;
        
        // If it's a full URL, extract the path
        if (path.includes('/storage/v1/object/public/')) {
          const parts = path.split('/storage/v1/object/public/');
          if (parts[1]) {
            const bucketAndPath = parts[1];
            const slashIndex = bucketAndPath.indexOf('/');
            if (slashIndex > -1) {
              filePath = bucketAndPath.substring(slashIndex + 1);
            }
          }
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to get signed URL');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [bucket, path, expiresIn]);

  return { signedUrl, loading, error };
};

/**
 * Get a signed URL synchronously (for use in non-hook contexts)
 */
export const getSignedUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    // Extract the actual path from the full URL if needed
    let filePath = path;
    
    if (path.includes('/storage/v1/object/public/')) {
      const parts = path.split('/storage/v1/object/public/');
      if (parts[1]) {
        const bucketAndPath = parts[1];
        const slashIndex = bucketAndPath.indexOf('/');
        if (slashIndex > -1) {
          filePath = bucketAndPath.substring(slashIndex + 1);
        }
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed URL:', err);
    return null;
  }
};
