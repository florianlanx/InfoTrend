/**
 * 浏览器语言自动检测模块
 */
import { ActualLocale } from './types';

/**
 * 检测浏览器语言并返回对应的 Locale
 * 优先匹配中文，其他语言默认使用英文
 */
export function detectBrowserLocale(): ActualLocale {
  // 获取浏览器语言列表
  const languages = navigator.languages || [navigator.language];
  
  for (const lang of languages) {
    const normalizedLang = lang.toLowerCase();
    
    // 匹配中文（包括 zh、zh-cn、zh-hans、zh-sg 等）
    if (
      normalizedLang === 'zh' ||
      normalizedLang.startsWith('zh-cn') ||
      normalizedLang.startsWith('zh-hans') ||
      normalizedLang.startsWith('zh-sg')
    ) {
      return 'zh-CN';
    }
    
    // 繁体中文也归为简体中文（可根据需要调整）
    if (
      normalizedLang.startsWith('zh-tw') ||
      normalizedLang.startsWith('zh-hk') ||
      normalizedLang.startsWith('zh-hant')
    ) {
      return 'zh-CN';
    }
  }
  
  // 默认返回英文
  return 'en-US';
}

/**
 * 检查语言是否为中文
 */
export function isChinese(locale: string): boolean {
  const normalizedLang = locale.toLowerCase();
  return normalizedLang === 'zh' || normalizedLang.startsWith('zh-');
}
