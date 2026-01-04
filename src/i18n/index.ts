/**
 * i18n 模块入口
 */

// 导出类型
export type { Locale, ActualLocale, I18nContextValue, TranslationMap, LanguageOption } from './types';
export { LANGUAGE_OPTIONS } from './types';

// 导出 Context 和 Hooks
export { I18nProvider, useI18n, useTranslation, I18nContext } from './context';

// 导出存储服务
export { getStoredLocale, setStoredLocale, clearStoredLocale } from './storage';

// 导出语言检测
export { detectBrowserLocale, isChinese } from './detector';

// 导出翻译文件（用于调试或特殊场景）
export { zhCN } from './locales/zh-CN';
export { enUS } from './locales/en-US';
