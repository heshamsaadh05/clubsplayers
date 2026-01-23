import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, MapPin, Ruler, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';

// Public player type - now includes date_of_birth for age, excludes contact info and club history
type PublicPlayer = {
  id: string;
  user_id: string;
  full_name: string;
  position: string | null;
  nationality: string | null;
  bio: string | null;
  profile_image_url: string | null;
  video_urls: string[] | null;
  height_cm: number | null;
  weight_kg: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  date_of_birth: string | null;
};

interface FavoriteWithPlayer {
  id: string;
  player_id: string;
  created_at: string;
  player: PublicPlayer;
}

const FavoritesList = () => {
  const navigate = useNavigate();
  const { favorites, loading: favLoading, removeFavorite } = useFavorites();
  const [favoritePlayers, setFavoritePlayers] = useState<FavoriteWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (favorites.length === 0) {
        setFavoritePlayers([]);
        setLoading(false);
        return;
      }

      try {
        const playerIds = favorites.map(f => f.player_id);
        // Use public view to exclude PII like email, phone, DOB
        const { data: players, error } = await supabase
          .from('players_public')
          .select('*')
          .in('id', playerIds);

        if (error) throw error;

        const combined = favorites
          .map(fav => {
            const player = players?.find(p => p.id === fav.player_id);
            if (player) {
              return { ...fav, player };
            }
            return null;
          })
          .filter((item): item is FavoriteWithPlayer => item !== null);

        setFavoritePlayers(combined);
      } catch (error) {
        console.error('Error fetching favorite players:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!favLoading) {
      fetchPlayers();
    }
  }, [favorites, favLoading]);

  // calculateAge removed - date_of_birth is now private PII

  if (loading || favLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" />
            اللاعبون المفضلون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-gold" />
          اللاعبون المفضلون ({favoritePlayers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favoritePlayers.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              لم تقم بإضافة أي لاعبين للمفضلة بعد
            </p>
            <Button onClick={() => navigate('/browse-players')}>
              تصفح اللاعبين
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {favoritePlayers.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/player/${item.player.id}`)}
                  >
                    {item.player.profile_image_url ? (
                      <img
                        src={item.player.profile_image_url}
                        alt={item.player.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/player/${item.player.id}`)}
                  >
                    <p className="font-medium truncate">{item.player.full_name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {item.player.position && (
                        <Badge variant="secondary" className="text-xs">
                          {item.player.position}
                        </Badge>
                      )}
                      {item.player.nationality && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.player.nationality}
                        </span>
                      )}
                      {item.player.height_cm && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {item.player.height_cm} سم
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeFavorite(item.player_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoritesList;
