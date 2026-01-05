/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { FeedItem, SourceConfig } from '../types/index.ts';
import { SourceRegistry, SourceFetchOptions } from '../sources/index.ts';
import { getCache, saveCache, updateLastUpdate, saveFeeds } from './storage.ts';
import { logger } from '../utils/logger.ts';

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

// Flag to force bypass cache on next fetch
let forceRefresh = false;

/**
 * Set force refresh flag to bypass cache
 */
export function setForceRefresh(value: boolean): void {
  forceRefresh = value;
}

/**
 * Map SourceConfig to SourceFetchOptions
 */
function mapSourceConfigToOptions(
  source: SourceConfig
): SourceFetchOptions {
  const baseOptions: SourceFetchOptions = {
    count: source.fetchCount,
  };

  // Handle source-specific options
  if (source.type === 'HackerNews' && source.minScore) {
    (baseOptions as any).minScore = source.minScore;
  }

  if (source.type === 'ArXiv') {
    // Default ArXiv query can be overridden via custom config
    (baseOptions as any).query =
      'cat:cs.AI OR cat:cs.LG OR cat:cs.CL';
  }

  if (source.type === 'RSS' && source.url) {
    (baseOptions as any).url = source.url;
    (baseOptions as any).sourceName = source.name;
    (baseOptions as any).timeRange = source.fetchTimeRange || '7d';
  }

  return baseOptions;
}

/**
 * Fetch data from all enabled sources
 * Uses the new SourceRegistry instead of switch-case
 */
export async function fetchAllData(sources: SourceConfig[]): Promise<FeedItem[]> {
  const enabledSources = sources.filter((s) => s.enabled);

  const results = await Promise.allSettled(
    enabledSources.map((source) => fetchDataByType(source))
  );

  const allItems: FeedItem[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      // Attach isPinned property from source config to items
      const source = enabledSources[index];
      const items = result.value.map(item => ({
        ...item,
        isPinned: source.isPinned
      }));
      allItems.push(...items);
    } else {
      logger.error(`Error fetching ${enabledSources[index].name}:`, result);
    }
  });

  // Sort by pinned (true first) then published date (most recent first)
  return allItems.sort((a, b) => {
    // 1. Sort by pinned status (pinned items first)
    if (a.isPinned !== b.isPinned) {
      return (a.isPinned ? -1 : 1);
    }

    // 2. Sort by published date
    const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt || 0);
    const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(b.publishedAt || 0);
    return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
  });
}

/**
 * Fetch data from a specific source type
 * Uses SourceRegistry to get and execute the source
 */
async function fetchDataByType(source: SourceConfig): Promise<FeedItem[]> {
  const cacheKey = `cache_${source.id || source.type}`;
  const cachedData = await getCache(cacheKey);

  // Check if cache is still valid (skip if forceRefresh is set)
  if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.items;
  }

  try {
    // Map source type to registry name
    const sourceName = source.type === 'RSS' ? 'RSS' : source.type;

    // Check if source is registered
    if (!SourceRegistry.has(sourceName)) {
      logger.warn(`Source ${sourceName} not found in registry`);
      return cachedData?.items || [];
    }

    // Map config to options
    const options = mapSourceConfigToOptions(source);

    // Fetch from registry
    const items = await SourceRegistry.fetchFrom(sourceName, options);

    // Cache the results
    await saveCache(cacheKey, {
      items,
      timestamp: Date.now(),
    });

    return items;
  } catch (error) {
    logger.error(`Error fetching ${source.type}:`, error);
    return cachedData?.items || [];
  }
}

/**
 * Trigger background refresh
 */
export async function triggerRefresh(sources: SourceConfig[]): Promise<void> {
  const items = await fetchAllData(sources);

  await saveFeeds(items);
  await updateLastUpdate();
}

/**
 * Get list of all registered source names
 */
export function getRegisteredSources(): string[] {
  return SourceRegistry.getRegisteredNames();
}
