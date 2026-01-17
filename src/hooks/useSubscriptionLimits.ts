import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Feature ID to limit mapping
const FEATURE_LIMITS: Record<string, number> = {
  view_5_players: 5,
  view_10_players: 10,
  view_25_players: 25,
  view_50_players: 50,
  view_unlimited: -1, // -1 means unlimited
  message_5: 5,
  message_20: 20,
  message_50: 50,
  message_unlimited: -1,
  favorites_10: 10,
  favorites_unlimited: -1,
};

// Feature labels for matching
const FEATURE_LABELS: Record<string, string[]> = {
  view_5_players: ['مشاهدة 5 لاعبين'],
  view_10_players: ['مشاهدة 10 لاعبين'],
  view_25_players: ['مشاهدة 25 لاعب'],
  view_50_players: ['مشاهدة 50 لاعب'],
  view_unlimited: ['مشاهدة غير محدودة', 'مشاهدة غير محدودة للاعبين'],
  message_5: ['5 رسائل شهرياً'],
  message_20: ['20 رسالة شهرياً'],
  message_50: ['50 رسالة شهرياً'],
  message_unlimited: ['رسائل غير محدودة'],
  advanced_filter: ['الفلترة المتقدمة'],
  basic_search: ['البحث الأساسي'],
  filter_position: ['فلترة حسب المركز', 'الفلترة حسب المركز'],
  filter_nationality: ['فلترة حسب الجنسية', 'الفلترة حسب الجنسية'],
  filter_age: ['فلترة حسب العمر', 'الفلترة حسب العمر'],
  filter_physical: ['فلترة حسب المواصفات الجسدية', 'الفلترة حسب المواصفات الجسدية'],
  priority_featured: ['أولوية عرض اللاعبين المتميزين', 'عرض اللاعبين المتميزين أولاً'],
  priority_new: ['أولوية عرض اللاعبين الجدد', 'عرض اللاعبين الجدد أولاً'],
  club_verification: ['توثيق النادي', 'توثيق النادي (علامة زرقاء)'],
  contact_info: ['عرض معلومات الاتصال', 'عرض معلومات الاتصال الكاملة'],
  player_videos: ['مشاهدة فيديوهات اللاعبين'],
  favorites: ['إضافة للمفضلة', 'إضافة لاعبين للمفضلة'],
  favorites_unlimited: ['مفضلة غير محدودة', 'قائمة مفضلة غير محدودة'],
};

interface SubscriptionLimits {
  playerViews: number; // -1 for unlimited
  messages: number;
  favorites: number;
  hasAdvancedFilter: boolean;
  hasPositionFilter: boolean;
  hasNationalityFilter: boolean;
  hasAgeFilter: boolean;
  hasPhysicalFilter: boolean;
  hasPriorityFeatured: boolean;
  hasPriorityNew: boolean;
  hasClubVerification: boolean;
  hasContactInfo: boolean;
  hasPlayerVideos: boolean;
}

interface UsageStats {
  playerViews: number;
  messagesSent: number;
  favoritesCount: number;
}

const DEFAULT_LIMITS: SubscriptionLimits = {
  playerViews: 0,
  messages: 0,
  favorites: 0,
  hasAdvancedFilter: false,
  hasPositionFilter: false,
  hasNationalityFilter: false,
  hasAgeFilter: false,
  hasPhysicalFilter: false,
  hasPriorityFeatured: false,
  hasPriorityNew: false,
  hasClubVerification: false,
  hasContactInfo: false,
  hasPlayerVideos: false,
};

export const useSubscriptionLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits>(DEFAULT_LIMITS);
  const [usage, setUsage] = useState<UsageStats>({ playerViews: 0, messagesSent: 0, favoritesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const matchFeature = (features: string[], featureId: string): boolean => {
    const labels = FEATURE_LABELS[featureId] || [];
    return features.some(f => labels.some(label => f.includes(label)));
  };

  const getViewLimit = (features: string[]): number => {
    if (matchFeature(features, 'view_unlimited')) return -1;
    if (matchFeature(features, 'view_50_players')) return 50;
    if (matchFeature(features, 'view_25_players')) return 25;
    if (matchFeature(features, 'view_10_players')) return 10;
    if (matchFeature(features, 'view_5_players')) return 5;
    return 5; // Default
  };

  const getMessageLimit = (features: string[]): number => {
    if (matchFeature(features, 'message_unlimited')) return -1;
    if (matchFeature(features, 'message_50')) return 50;
    if (matchFeature(features, 'message_20')) return 20;
    if (matchFeature(features, 'message_5')) return 5;
    return 5; // Default
  };

  const fetchLimitsAndUsage = useCallback(async () => {
    if (!user) {
      setLimits(DEFAULT_LIMITS);
      setUsage({ playerViews: 0, messagesSent: 0, favoritesCount: 0 });
      setLoading(false);
      return;
    }

    try {
      // Fetch active subscription with plan features
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      if (!subData || !subData.subscription_plans) {
        setHasActiveSubscription(false);
        setLimits(DEFAULT_LIMITS);
        setLoading(false);
        return;
      }

      setHasActiveSubscription(true);
      const features = (subData.subscription_plans.features as string[]) || [];

      // Parse limits from features
      const parsedLimits: SubscriptionLimits = {
        playerViews: getViewLimit(features),
        messages: getMessageLimit(features),
        favorites: matchFeature(features, 'favorites_unlimited') ? -1 : 10,
        hasAdvancedFilter: matchFeature(features, 'advanced_filter'),
        hasPositionFilter: matchFeature(features, 'filter_position') || matchFeature(features, 'advanced_filter'),
        hasNationalityFilter: matchFeature(features, 'filter_nationality') || matchFeature(features, 'advanced_filter'),
        hasAgeFilter: matchFeature(features, 'filter_age') || matchFeature(features, 'advanced_filter'),
        hasPhysicalFilter: matchFeature(features, 'filter_physical') || matchFeature(features, 'advanced_filter'),
        hasPriorityFeatured: matchFeature(features, 'priority_featured'),
        hasPriorityNew: matchFeature(features, 'priority_new'),
        hasClubVerification: matchFeature(features, 'club_verification'),
        hasContactInfo: matchFeature(features, 'contact_info'),
        hasPlayerVideos: matchFeature(features, 'player_videos'),
      };

      setLimits(parsedLimits);

      // Fetch current month usage
      const monthYear = getCurrentMonthYear();
      const { data: usageData } = await supabase
        .from('club_usage')
        .select('*')
        .eq('club_user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (usageData) {
        setUsage({
          playerViews: usageData.player_views,
          messagesSent: usageData.messages_sent,
          favoritesCount: usageData.favorites_count,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLimitsAndUsage();
  }, [fetchLimitsAndUsage]);

  const canViewPlayer = useCallback((playerId: string): boolean => {
    if (!hasActiveSubscription) return false;
    if (limits.playerViews === -1) return true; // Unlimited
    return usage.playerViews < limits.playerViews;
  }, [hasActiveSubscription, limits.playerViews, usage.playerViews]);

  const canSendMessage = useCallback((): boolean => {
    if (!hasActiveSubscription) return false;
    if (limits.messages === -1) return true;
    return usage.messagesSent < limits.messages;
  }, [hasActiveSubscription, limits.messages, usage.messagesSent]);

  const canAddFavorite = useCallback((): boolean => {
    if (!hasActiveSubscription) return false;
    if (limits.favorites === -1) return true;
    return usage.favoritesCount < limits.favorites;
  }, [hasActiveSubscription, limits.favorites, usage.favoritesCount]);

  const recordPlayerView = async (playerId: string): Promise<boolean> => {
    if (!user || !hasActiveSubscription) return false;

    try {
      // Check if already viewed
      const { data: existingView } = await supabase
        .from('player_views')
        .select('id')
        .eq('club_user_id', user.id)
        .eq('player_id', playerId)
        .maybeSingle();

      if (existingView) {
        return true; // Already viewed, doesn't count against limit
      }

      // Check limit
      if (limits.playerViews !== -1 && usage.playerViews >= limits.playerViews) {
        toast.error('لقد وصلت للحد الأقصى من مشاهدات اللاعبين هذا الشهر');
        return false;
      }

      // Record the view
      const { error: viewError } = await supabase
        .from('player_views')
        .insert({ club_user_id: user.id, player_id: playerId });

      if (viewError && viewError.code !== '23505') throw viewError;

      // Update usage
      const monthYear = getCurrentMonthYear();
      const { data: currentUsage } = await supabase
        .from('club_usage')
        .select('*')
        .eq('club_user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (currentUsage) {
        await supabase
          .from('club_usage')
          .update({ player_views: currentUsage.player_views + 1 })
          .eq('id', currentUsage.id);
      } else {
        await supabase
          .from('club_usage')
          .insert({
            club_user_id: user.id,
            month_year: monthYear,
            player_views: 1,
          });
      }

      setUsage(prev => ({ ...prev, playerViews: prev.playerViews + 1 }));
      return true;
    } catch (error) {
      console.error('Error recording player view:', error);
      return false;
    }
  };

  const recordMessageSent = async (): Promise<boolean> => {
    if (!user || !hasActiveSubscription) return false;

    try {
      if (limits.messages !== -1 && usage.messagesSent >= limits.messages) {
        toast.error('لقد وصلت للحد الأقصى من الرسائل هذا الشهر');
        return false;
      }

      const monthYear = getCurrentMonthYear();
      const { data: currentUsage } = await supabase
        .from('club_usage')
        .select('*')
        .eq('club_user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (currentUsage) {
        await supabase
          .from('club_usage')
          .update({ messages_sent: currentUsage.messages_sent + 1 })
          .eq('id', currentUsage.id);
      } else {
        await supabase
          .from('club_usage')
          .insert({
            club_user_id: user.id,
            month_year: monthYear,
            messages_sent: 1,
          });
      }

      setUsage(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
      return true;
    } catch (error) {
      console.error('Error recording message:', error);
      return false;
    }
  };

  const getRemainingViews = (): number | 'unlimited' => {
    if (limits.playerViews === -1) return 'unlimited';
    return Math.max(0, limits.playerViews - usage.playerViews);
  };

  const getRemainingMessages = (): number | 'unlimited' => {
    if (limits.messages === -1) return 'unlimited';
    return Math.max(0, limits.messages - usage.messagesSent);
  };

  return {
    limits,
    usage,
    loading,
    hasActiveSubscription,
    canViewPlayer,
    canSendMessage,
    canAddFavorite,
    recordPlayerView,
    recordMessageSent,
    getRemainingViews,
    getRemainingMessages,
    refetch: fetchLimitsAndUsage,
  };
};
