/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
import { AppConfig, FeedItem, SourceConfig } from '../types/index.ts';
import { defaultConfig } from '../types/index.ts';
import { safeStorageGet, safeStorageSet, safeStorageClear } from '../utils/chrome.ts';

// 存储键名
const STORAGE_KEYS = {
  CONFIG: 'infotrend_config',
  FEEDS: 'infotrend_feeds',
  CACHE: 'infotrend_cache',
  LAST_UPDATE: 'infotrend_last_update',
  DATA_METADATA: 'infotrend_data_metadata',
};

// 获取配置
export async function getConfig(): Promise<AppConfig> {
  const result = await safeStorageGet([STORAGE_KEYS.CONFIG]);
  const config = result[STORAGE_KEYS.CONFIG];
  return config || defaultConfig;
}

// 保存配置
export async function saveConfig(config: AppConfig): Promise<void> {
  await safeStorageSet({ [STORAGE_KEYS.CONFIG]: config });
}

// 获取Feed数据
export async function getFeeds(): Promise<FeedItem[]> {
  const result = await safeStorageGet([STORAGE_KEYS.FEEDS]);
  const feeds = result[STORAGE_KEYS.FEEDS];
  return feeds || [];
}

// 保存Feed数据
export async function saveFeeds(feeds: FeedItem[]): Promise<void> {
  await safeStorageSet({ [STORAGE_KEYS.FEEDS]: feeds });
}

// 获取缓存
export async function getCache(key: string): Promise<any> {
  const result = await safeStorageGet([key]);
  return result[key];
}

// 保存缓存
export async function saveCache(key: string, value: any): Promise<void> {
  await safeStorageSet({ [key]: value });
}

// 获取最后更新时间
export async function getLastUpdate(): Promise<number> {
  const result = await safeStorageGet([STORAGE_KEYS.LAST_UPDATE]);
  return result[STORAGE_KEYS.LAST_UPDATE] || 0;
}

// 更新最后更新时间
export async function updateLastUpdate(): Promise<void> {
  await safeStorageSet({ [STORAGE_KEYS.LAST_UPDATE]: Date.now() });
}

// 数据元信息接口（用于智能刷新策略）
export interface DataMetadata {
  lastUpdateTime: number;      // 最后更新时间戳
  lastUpdateDate: string;      // 最后更新日期 YYYY-MM-DD
}

// 获取数据元信息
export async function getDataMetadata(): Promise<DataMetadata | null> {
  const result = await safeStorageGet([STORAGE_KEYS.DATA_METADATA]);
  return result[STORAGE_KEYS.DATA_METADATA] || null;
}

// 更新数据元信息
export async function updateDataMetadata(): Promise<void> {
  const now = new Date();
  const metadata: DataMetadata = {
    lastUpdateTime: now.getTime(),
    lastUpdateDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  };
  await safeStorageSet({ [STORAGE_KEYS.DATA_METADATA]: metadata });
}

// 清除所有数据
export async function clearAll(): Promise<void> {
  await safeStorageClear();
}

// 导出数据
export async function exportData(format: 'json' | 'csv'): Promise<string> {
  const config = await getConfig();
  const feeds = await getFeeds();

  if (format === 'json') {
    return JSON.stringify({ config, feeds }, null, 2);
  }

  // CSV格式
  const headers = ['id', 'title', 'source', 'url', 'summary', 'publishedAt', 'tags', 'aiSummary'];
  const rows = feeds.map(feed => {
    const dateStr = typeof feed.publishedAt === 'string' 
      ? feed.publishedAt 
      : feed.publishedAt.toISOString();
    return [
      feed.id,
      `"${feed.title.replace(/"/g, '""')}"`,
      feed.source,
      feed.url,
      `"${(feed.summary || '').replace(/"/g, '""')}"`,
      dateStr,
      `"${(feed.tags || []).join(',')}"`,
      `"${(feed.aiSummary || '').replace(/"/g, '""')}"`,
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

// 导入数据
export async function importData(data: string, format: 'json' | 'csv'): Promise<boolean> {
  try {
    if (format === 'json') {
      const imported = JSON.parse(data);
      if (imported.config) await saveConfig(imported.config);
      if (imported.feeds) await saveFeeds(imported.feeds);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}
