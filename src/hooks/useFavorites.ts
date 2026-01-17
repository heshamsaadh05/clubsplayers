import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  player_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('club_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((playerId: string) => {
    return favorites.some(fav => fav.player_id === playerId);
  }, [favorites]);

  const addFavorite = async (playerId: string) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          club_user_id: user.id,
          player_id: playerId,
        });

      if (error) {
        if (error.code === '23505') {
          // Already exists
          return true;
        }
        throw error;
      }

      await fetchFavorites();
      toast.success('تمت إضافة اللاعب للمفضلة');
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('حدث خطأ أثناء إضافة اللاعب للمفضلة');
      return false;
    }
  };

  const removeFavorite = async (playerId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('club_user_id', user.id)
        .eq('player_id', playerId);

      if (error) throw error;

      await fetchFavorites();
      toast.success('تمت إزالة اللاعب من المفضلة');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('حدث خطأ أثناء إزالة اللاعب من المفضلة');
      return false;
    }
  };

  const toggleFavorite = async (playerId: string) => {
    if (isFavorite(playerId)) {
      return removeFavorite(playerId);
    } else {
      return addFavorite(playerId);
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
};
