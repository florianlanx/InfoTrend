import { useState, useEffect, useCallback } from 'react';
import { safeStorageGet, safeStorageSet } from '@/utils/chrome.ts';
import { logger } from '@/utils/logger.ts';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'infotrend_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // 加载主题
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await safeStorageGet([THEME_STORAGE_KEY]);
        const savedTheme = result[THEME_STORAGE_KEY] as Theme;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        } else {
          // 默认为 light 模式
          applyTheme('light');
        }
      } catch (error) {
        logger.error('Failed to load theme:', error);
        applyTheme('light');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // 应用主题到 DOM
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  // 设置主题
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      await safeStorageSet({ [THEME_STORAGE_KEY]: newTheme });
    } catch (error) {
      logger.error('Failed to save theme:', error);
    }
  }, []);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
    isDark: theme === 'dark',
  };
}
