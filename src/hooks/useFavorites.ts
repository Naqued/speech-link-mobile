import { useState, useEffect } from 'react';
import { favoritesService, Favorite } from '../services/favoritesService';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await favoritesService.fetchFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (favoriteData: Partial<Favorite>) => {
    try {
      const newFavorite = await favoritesService.addFavorite(favoriteData);
      setFavorites(prev => [...prev, newFavorite]);
      return newFavorite;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add favorite');
      throw err;
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await favoritesService.removeFavorite(id);
      setFavorites(prev => prev.filter(fav => fav.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
      throw err;
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    isLoading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
  };
}; 