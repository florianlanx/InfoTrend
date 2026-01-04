/**
 * 语言偏好存储服务
 * 使用 Chrome Storage API 持久化用户语言偏好
 */
import { Locale } from './types';

const STORAGE_KEY = 'infotrend_locale';

/**
 * 获取存储的语言偏好
 */
export async function getStoredLocale(): Promise<Locale | null> {
  // 检查是否在 Chrome 扩展环境中
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        resolve((result[STORAGE_KEY] as Locale) || null);
      });
    });
  }
  
  // 降级到 localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored as Locale | null;
}

/**
 * 保存语言偏好
 */
export async function setStoredLocale(locale: Locale): Promise<void> {
  // 检查是否在 Chrome 扩展环境中
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEY]: locale }, () => {
        resolve();
      });
    });
  }
  
  // 降级到 localStorage
  localStorage.setItem(STORAGE_KEY, locale);
}

/**
 * 清除存储的语言偏好
 */
export async function clearStoredLocale(): Promise<void> {
  // 检查是否在 Chrome 扩展环境中
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove([STORAGE_KEY], () => {
        resolve();
      });
    });
  }
  
  // 降级到 localStorage
  localStorage.removeItem(STORAGE_KEY);
}
