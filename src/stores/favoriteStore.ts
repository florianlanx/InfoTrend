import { create } from 'zustand';
import { FavoriteItem } from '../types/favorite';

interface FavoriteState {
  favorites: Map<string, FavoriteItem>;
  favoriteFilter: 'all' | 'favorite' | 'non-favorite';
  tagFilter: string | null;
  
  // Actions
  toggleFavorite: (id: string, content: string, generateTags?: boolean) => Promise<void>;
  setFavorite: (id: string, isFavorite: boolean) => void;
  updateTags: (id: string, tags: string[], category: string) => void;
  regenerateTags: (id: string, content: string) => Promise<void>;
  setFavoriteFilter: (filter: 'all' | 'favorite' | 'non-favorite') => void;
  setTagFilter: (tag: string | null) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: new Map(),
  favoriteFilter: 'all',
  tagFilter: null,

  toggleFavorite: async (id: string, content: string, generateTags = false) => {
    const { favorites } = get();
    const existing = favorites.get(id);
    
    if (existing) {
      // 取消收藏
      const newFavorites = new Map(favorites);
      newFavorites.delete(id);
      set({ favorites: newFavorites });
      await get().saveToStorage();
    } else {
      // 添加收藏
      const newFavorite: FavoriteItem = {
        id,
        isFavorite: true,
        tags: [],
        category: 'Other',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const newFavorites = new Map(favorites);
      newFavorites.set(id, newFavorite);
      set({ favorites: newFavorites });
      await get().saveToStorage();
      
      // 如果需要生成标签，触发AI生成
      if (generateTags) {
        await get().regenerateTags(id, content);
      }
    }
  },

  setFavorite: (id: string, isFavorite: boolean) => {
    const { favorites } = get();
    const newFavorites = new Map(favorites);
    
    if (isFavorite) {
      newFavorites.set(id, {
        id,
        isFavorite: true,
        tags: [],
        category: 'Other',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      newFavorites.delete(id);
    }
    
    set({ favorites: newFavorites });
    get().saveToStorage();
  },

  updateTags: (id: string, tags: string[], category: string) => {
    const { favorites } = get();
    const existing = favorites.get(id);
    
    if (existing) {
      const newFavorites = new Map(favorites);
      newFavorites.set(id, {
        ...existing,
        tags,
        category,
        updatedAt: Date.now(),
      });
      set({ favorites: newFavorites });
      get().saveToStorage();
    }
  },

  regenerateTags: async (id: string, content: string) => {
    // 导入 AI 服务 - 动态导入避免循环依赖
    const { generateTags } = await import('../services/aiService');
    
    try {
      // skipCache = true 强制重新生成
      const result = await generateTags(content, true);
      get().updateTags(id, result.tags, result.category);
    } catch (error) {
      console.error('Failed to regenerate tags:', error);
      throw error; // 重新抛出错误让调用方知道失败
    }
  },

  setFavoriteFilter: (filter: 'all' | 'favorite' | 'non-favorite') => {
    set({ favoriteFilter: filter });
  },

  setTagFilter: (tag: string | null) => {
    set({ tagFilter: tag });
  },

  loadFromStorage: async () => {
    try {
      const result = await chrome.storage.local.get('favorites');
      const favoritesData = result.favorites;
      
      if (favoritesData && Array.isArray(favoritesData)) {
        const favorites = new Map(favoritesData.map((item: FavoriteItem) => [item.id, item]));
        set({ favorites });
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error);
    }
  },

  saveToStorage: async () => {
    const { favorites } = get();
    try {
      await chrome.storage.local.set({
        favorites: Array.from(favorites.values()),
      });
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  },
}));

// 初始化时加载数据
useFavoriteStore.getState().loadFromStorage();
