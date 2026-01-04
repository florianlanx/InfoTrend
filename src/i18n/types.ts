/**
 * i18n 类型定义
 */

// 支持的语言类型
export type Locale = 'zh-CN' | 'en-US' | 'auto';

// 实际使用的语言（不包含 auto）
export type ActualLocale = 'zh-CN' | 'en-US';

// 翻译文件结构
export interface TranslationMap {
  [key: string]: string;
}

// i18n Context 值类型
export interface I18nContextValue {
  locale: Locale;
  actualLocale: ActualLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

// 语言选项
export interface LanguageOption {
  value: Locale;
  label: string;
  nativeLabel: string;
}

// 预定义的语言选项
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'auto', label: 'Follow System', nativeLabel: '跟随系统' },
  { value: 'zh-CN', label: 'Chinese (Simplified)', nativeLabel: '简体中文' },
  { value: 'en-US', label: 'English', nativeLabel: 'English' },
];
