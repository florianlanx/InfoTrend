/*
 *   Copyright (c) 2025 InfoTrend Contributors
 *   All rights reserved.
 */

/**
 * Chrome API utility functions for safe Chrome Extension API calls
 */

export const isChromeExtension = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
};

export const safeStorageGet = (keys: string[]): Promise<any> => {
  return new Promise((resolve) => {
    if (isChromeExtension() && chrome.storage) {
      chrome.storage.local.get(keys, resolve);
    } else {
      // Dev environment fallback to localStorage
      const result: any = {};
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      resolve(result);
    }
  });
};

export const safeStorageSet = (items: Record<string, any>): Promise<void> => {
  return new Promise((resolve) => {
    if (isChromeExtension() && chrome.storage) {
      chrome.storage.local.set(items, resolve);
    } else {
      // Dev environment fallback to localStorage
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      resolve();
    }
  });
};

export const safeStorageClear = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isChromeExtension() && chrome.storage) {
      chrome.storage.local.clear(resolve);
    } else {
      // Dev environment clear localStorage
      localStorage.clear();
      resolve();
    }
  });
};

export const safeTabsCreate = (createProperties: { url: string }): void => {
  if (isChromeExtension() && chrome.tabs) {
    chrome.tabs.create(createProperties);
  } else {
    // Dev environment open in new window
    window.open(createProperties.url, '_blank');
  }
};

export const safeRuntimeSendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isChromeExtension() && chrome.runtime) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } else {
      // Dev environment fallback
      resolve({ success: true });
    }
  });
};

export const safeOpenOptionsPage = (): void => {
  if (isChromeExtension() && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    // Dev environment open options page directly
    window.open('/options.html', '_blank');
  }
};