
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!pb.authStore.isValid) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const records = await pb.collection('favoritos').getFullList({
        filter: `usuario_id = "${pb.authStore.model.id}"`,
        $autoCancel: false
      });
      setFavorites(records);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [pb.authStore.isValid]);

  const isFavorited = (reformaId) => {
    return favorites.some(fav => fav.reforma_id === reformaId);
  };

  const addFavorite = async (reformaId) => {
    if (!pb.authStore.isValid) {
      throw new Error('Must be logged in to add favorites');
    }

    try {
      const newFavorite = await pb.collection('favoritos').create({
        usuario_id: pb.authStore.model.id,
        reforma_id: reformaId
      }, { $autoCancel: false });
      
      setFavorites(prev => [...prev, newFavorite]);
      return newFavorite;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (reformaId) => {
    if (!pb.authStore.isValid) {
      throw new Error('Must be logged in to remove favorites');
    }

    try {
      const favorite = favorites.find(fav => fav.reforma_id === reformaId);
      if (favorite) {
        await pb.collection('favoritos').delete(favorite.id, { $autoCancel: false });
        setFavorites(prev => prev.filter(fav => fav.id !== favorite.id));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  return {
    favorites,
    loading,
    isFavorited,
    addFavorite,
    removeFavorite,
    refetch: fetchFavorites
  };
}
