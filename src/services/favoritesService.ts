import { apiService } from './apiService';

export interface Favorite {
  id: string;
  // Add other favorite properties based on your API response
  [key: string]: any;
}

class FavoritesService {
  private static instance: FavoritesService;

  private constructor() {}

  public static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  public async fetchFavorites(): Promise<Favorite[]> {
    try {
      return await apiService.get<Favorite[]>('/favorites');
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  public async addFavorite(favoriteData: Partial<Favorite>): Promise<Favorite> {
    try {
      return await apiService.post<Favorite>('/favorites', favoriteData);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  public async removeFavorite(id: string): Promise<void> {
    try {
      await apiService.delete(`/favorites/${id}`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = FavoritesService.getInstance(); 