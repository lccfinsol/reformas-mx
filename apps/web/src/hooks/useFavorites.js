
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useFavorites = (reformaId = null) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkFavorite = useCallback(async () => {
    if (!isAuthenticated || !currentUser || !reformaId) {
      setIsFavorite(false);
      setLoading(false);
      return;
    }

    try {
      const records = await pb.collection('favoritos').getFullList({
        filter: `usuario_id="${currentUser.id}" && reforma_id="${reformaId}"`,
        $autoCancel: false
      });
      
      if (records.length > 0) {
        setIsFavorite(true);
        setFavoriteId(records[0].id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAuthenticated, reformaId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !currentUser || !reformaId) return null;

    try {
      setLoading(true);
      if (isFavorite && favoriteId) {
        await pb.collection('favoritos').delete(favoriteId, { $autoCancel: false });
        setIsFavorite(false);
        setFavoriteId(null);
        return false;
      } else {
        const record = await pb.collection('favoritos').create({
          usuario_id: currentUser.id,
          reforma_id: reformaId
        }, { $autoCancel: false });
        setIsFavorite(true);
        setFavoriteId(record.id);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, toggleFavorite, loading };
};
