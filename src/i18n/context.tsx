/**
 * Language Context Provider
 * 提供全局语言状态管理
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Locale, ActualLocale, I18nContextValue, TranslationMap } from './types';
import { getStoredLocale, setStoredLocale } from './storage';
import { detectBrowserLocale } from './detector';
import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';

// 翻译文件映射
const translations: Record<ActualLocale, TranslationMap> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// 创建 Context
const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

/**
 * I18n Provider 组件
 */
export function I18nProvider({ children, defaultLocale = 'auto' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  // 计算实际使用的语言
  const actualLocale: ActualLocale = useMemo(() => {
    if (locale === 'auto') {
      return detectBrowserLocale();
    }
    return locale;
  }, [locale]);

  // 初始化：从存储中加载语言偏好
  useEffect(() => {
    const initLocale = async () => {
      const storedLocale = await getStoredLocale();
      if (storedLocale) {
        setLocaleState(storedLocale);
      }
      setIsInitialized(true);
    };
    initLocale();
  }, []);

  // 设置语言并持久化
  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await setStoredLocale(newLocale);
  }, []);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = translations[actualLocale][key];
    
    if (!translation) {
      console.warn(`[i18n] Missing translation for key: ${key}`);
      return key;
    }

    // 替换参数
    if (params) {
      return Object.entries(params).reduce(
        (result, [paramKey, paramValue]) => 
          result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
        translation
      );
    }

    return translation;
  }, [actualLocale]);

  // Context 值
  const contextValue: I18nContextValue = useMemo(() => ({
    locale,
    actualLocale,
    t,
    setLocale,
  }), [locale, actualLocale, t, setLocale]);

  // 等待初始化完成
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useI18n Hook
 * 获取 i18n 上下文
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}

/**
 * 简化的翻译 Hook
 * 仅返回 t 函数
 */
export function useTranslation() {
  const { t, actualLocale } = useI18n();
  return { t, locale: actualLocale };
}

export { I18nContext };
