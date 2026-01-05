/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource';
import { FeedItem, SourceType } from '../types/index';
import { SourceRegistry } from './SourceRegistry';
import { logger } from '../utils/logger';

/**
 * RSS2JSON API response types
 */
interface RSS2JSONItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
}

interface RSS2JSONResponse {
  items: RSS2JSONItem[];
}

/**
 * RSS proxy service configuration
 */
interface RSSProxyConfig {
  url: string;
  buildUrl: (feedUrl: string) => string;
  parseResponse: (data: unknown) => RSS2JSONItem[];
}

/**
 * Available RSS proxy services with fallback support
 */
const RSS_PROXIES: RSSProxyConfig[] = [
  {
    // Primary: rss2json.com
    url: 'https://api.rss2json.com/v1/api.json',
    buildUrl: (feedUrl: string) =>
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
    parseResponse: (data: unknown) => (data as RSS2JSONResponse).items,
  },
  {
    // Fallback 1: allorigins.win (CORS proxy)
    url: 'https://api.allorigins.win/get',
    buildUrl: (feedUrl: string) =>
      `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`,
    parseResponse: (data: unknown) => {
      const content = (data as { contents: string }).contents;
      return parseRSSXML(content);
    },
  },
  {
    // Fallback 2: corsproxy.io
    url: 'https://corsproxy.io/',
    buildUrl: (feedUrl: string) =>
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
    parseResponse: (data: unknown) => parseRSSXML(data as string),
  },
];

/**
 * Parse RSS XML content to extract items
 */
function parseRSSXML(xmlContent: string): RSS2JSONItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const items = doc.querySelectorAll('item');

  return Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
    author: item.querySelector('author')?.textContent || undefined,
  }));
}

/**
 * Data source for Product Hunt
 * Uses RSS feed with multiple proxy fallback support
 */
export class ProductHuntSource extends BaseSource {
  readonly sourceName = 'ProductHunt';
  private readonly rssUrl = 'https://www.producthunt.com/feed';
  protected defaultCount = 5;

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const rssItems = await this.fetchWithFallback();

        return rssItems.slice(0, count).map((item, index) => ({
          id: this.generateId(`${index}-${Date.now()}`),
          title: item.title,
          source: this.sourceName as SourceType,
          url: item.link,
          summary: this.cleanString(this.stripHtml(item.description), 200),
          publishedAt: this.parseTimestamp(item.pubDate),
          author: item.author || 'Product Hunt',
        }));
      },
      []
    );

    return items;
  }

  /**
   * Fetch RSS data with fallback proxy support
   * Tries each proxy in order until one succeeds
   */
  private async fetchWithFallback(): Promise<RSS2JSONItem[]> {
    const errors: Error[] = [];

    for (const proxy of RSS_PROXIES) {
      try {
        const url = proxy.buildUrl(this.rssUrl);
        const response = await this.safeFetch(url);

        // For allorigins and corsproxy, we need to handle text response
        if (proxy.url.includes('allorigins') || proxy.url.includes('corsproxy')) {
          const data = proxy.url.includes('allorigins')
            ? await response.json()
            : await response.text();
          const items = proxy.parseResponse(data);
          if (items.length > 0) {
            return items;
          }
          throw new Error('No items parsed from RSS feed');
        }

        const data = await response.json();
        return proxy.parseResponse(data);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        logger.warn(`[ProductHunt] Proxy ${proxy.url} failed:`, err.message);
        continue;
      }
    }

    throw new Error(
      `All RSS proxies failed: ${errors.map((e) => e.message).join('; ')}`
    );
  }
}

// Auto-register this source
SourceRegistry.register(new ProductHuntSource());
