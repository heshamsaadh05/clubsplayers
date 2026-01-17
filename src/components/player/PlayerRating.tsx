import { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  club_user_id: string;
  club_name?: string;
}

interface PlayerRatingProps {
  playerId: string;
  isClub: boolean;
  hasAccess: boolean;
}

const PlayerRating = ({ playerId, isClub, hasAccess }: PlayerRatingProps) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchRatings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch club names for each rating
      const ratingsWithClubNames = await Promise.all(
        (data || []).map(async (rating) => {
          const { data: clubData } = await supabase
            .from('clubs')
            .select('name')
            .eq('user_id', rating.club_user_id)
            .maybeSingle();

          return {
            ...rating,
            club_name: clubData?.name || 'نادي',
          };
        })
      );

      setRatings(ratingsWithClubNames);

      // Find user's rating if exists
      const myRating = ratingsWithClubNames.find(
        (r) => r.club_user_id === user.id
      );
      if (myRating) {
        setUserRating(myRating);
        setSelectedRating(myRating.rating);
        setComment(myRating.comment || '');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchRatings();
    }
  }, [playerId, user, hasAccess]);

  const handleSubmitRating = async () => {
    if (!user || selectedRating === 0) return;

    setSubmitting(true);
    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('player_ratings')
          .update({
            rating: selectedRating,
            comment: comment.trim() || null,
          })
          .eq('id', userRating.id);

        if (error) throw error;
        toast.success('تم تحديث التقييم بنجاح');
      } else {
        // Insert new rating
        const { error } = await supabase.from('player_ratings').insert({
          player_id: playerId,
          club_user_id: user.id,
          rating: selectedRating,
          comment: comment.trim() || null,
        });

        if (error) throw error;
        toast.success('تم إضافة التقييم بنجاح');
      }

      setIsEditing(false);
      await fetchRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('حدث خطأ أثناء حفظ التقييم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;

    try {
      const { error } = await supabase
        .from('player_ratings')
        .delete()
        .eq('id', userRating.id);

      if (error) throw error;

      toast.success('تم حذف التقييم');
      setUserRating(null);
      setSelectedRating(0);
      setComment('');
      await fetchRatings();
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('حدث خطأ أثناء حذف التقييم');
    }
  };

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  const renderStars = (rating: number, interactive = false, size = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    };

    return (
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size as keyof typeof sizeClasses]} transition-all ${
              star <= (interactive ? hoverRating || selectedRating : rating)
                ? 'fill-gold text-gold'
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  if (!hasAccess) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            تقييمات الأندية
          </div>
          {ratings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gold">
                {averageRating.toFixed(1)}
              </span>
              {renderStars(Math.round(averageRating), false, 'sm')}
              <Badge variant="secondary">{ratings.length} تقييم</Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Form for Clubs */}
        {isClub && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {userRating ? 'تقييمك لهذا اللاعب' : 'قيّم هذا اللاعب'}
              </h4>
              {userRating && !isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteRating}
                  >
                    حذف
                  </Button>
                </div>
              )}
            </div>

            {(!userRating || isEditing) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">التقييم:</span>
                  {renderStars(selectedRating, true, 'lg')}
                  {selectedRating > 0 && (
                    <span className="text-lg font-bold text-gold">
                      {selectedRating}/5
                    </span>
                  )}
                </div>

                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="أضف تعليقاً (اختياري)..."
                  className="bg-background"
                />

                <div className="flex gap-2">
                  <Button
                    className="btn-gold"
                    onClick={handleSubmitRating}
                    disabled={submitting || selectedRating === 0}
                  >
                    {submitting ? (
                      'جاري الحفظ...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        {userRating ? 'تحديث التقييم' : 'إرسال التقييم'}
                      </>
                    )}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedRating(userRating?.rating || 0);
                        setComment(userRating?.comment || '');
                      }}
                    >
                      إلغاء
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {userRating && !isEditing && (
              <div className="space-y-2">
                {renderStars(userRating.rating, false, 'md')}
                {userRating.comment && (
                  <p className="text-muted-foreground">{userRating.comment}</p>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Ratings List */}
        <div className="space-y-4">
          <h4 className="font-medium">جميع التقييمات</h4>

          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : ratings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              لا توجد تقييمات بعد
            </p>
          ) : (
            <AnimatePresence>
              {ratings.map((rating, index) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-4 bg-muted/30 rounded-lg"
                >
                  <Avatar>
                    <AvatarFallback className="bg-gold/10 text-gold">
                      {rating.club_name?.charAt(0) || 'ن'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{rating.club_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rating.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {renderStars(rating.rating, false, 'sm')}
                    {rating.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerRating;
