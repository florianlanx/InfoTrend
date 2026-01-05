/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem, FetchTimeRange, TIME_RANGE_MS } from '../types/index.ts';
import { RegisterSource } from './SourceRegistry.ts';
import {
  parseXML,
  RSSParsedResult,
  RSSItem,
  AtomEntry,
  extractText,
  extractLink,
  ensureArray,
  stripHtml,
} from '../utils/xmlParser.ts';
import { logger } from '../utils/logger.ts';

interface RSSFetchOptions extends SourceFetchOptions {
  url?: string;
  sourceName?: string;
  timeRange?: FetchTimeRange; // 时间范围过滤
}

@RegisterSource()
export class RSSSource extends BaseSource {
  readonly sourceName = 'RSS';
  readonly baseUrl = ''; // RSS base URL depends on the specific feed

  async fetch(options?: RSSFetchOptions): Promise<FeedItem[]> {
    if (!options?.url) {
      logger.error('RSS source requires a URL');
      return [];
    }

    const maxCount = options?.count || 100; // 获取更多条目用于时间过滤
    const timeRange = options?.timeRange || '7d'; // 默认7天
    const cutoffTime = Date.now() - TIME_RANGE_MS[timeRange];
    
    return this.safeExecute(async () => {
      const response = await fetch(options.url!, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; InfoTrend/1.0)'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      // 使用 fast-xml-parser 解析 XML
      const parsed = parseXML<RSSParsedResult>(text);
      
      // 检测格式：RSS 2.0 或 Atom
      const isAtom = !!parsed.feed;
      const items = isAtom
        ? ensureArray(parsed.feed?.entry)
        : ensureArray(parsed.rss?.channel?.item);

      const feedItems: FeedItem[] = [];
      
      for (let index = 0; index < Math.min(items.length, maxCount); index++) {
        const item = items[index];
        
        let title: string;
        let link: string;
        let description: string;
        let pubDate: string;

        if (isAtom) {
          // Atom 格式
          const atomItem = item as AtomEntry;
          title = extractText(atomItem.title);
          link = extractLink(atomItem.link);
          description = stripHtml(extractText(atomItem.summary || atomItem.content));
          pubDate = atomItem.published || atomItem.updated || '';
        } else {
          // RSS 2.0 格式
          const rssItem = item as RSSItem;
          title = extractText(rssItem.title);
          link = extractLink(rssItem.link);
          description = stripHtml(extractText(rssItem.description));
          pubDate = rssItem.pubDate || rssItem['dc:date'] || '';
        }

        // Parse date, fallback to current time if invalid
        let publishedAtDate: Date;
        if (pubDate && pubDate.trim()) {
          const parsed = new Date(pubDate);
          if (isNaN(parsed.getTime())) {
            logger.warn(`[RSS] Invalid date parsed from "${pubDate}" in ${options.url}, fallback to now`);
            publishedAtDate = new Date();
          } else {
            publishedAtDate = parsed;
          }
        } else {
          publishedAtDate = new Date();
        }

        // 按时间范围过滤
        if (publishedAtDate.getTime() < cutoffTime) {
          continue; // 跳过超出时间范围的条目
        }

        feedItems.push({
          id: `rss-${options.url}-${index}`,
          title: title,
          source: 'RSS',
          sourceName: options.sourceName,
          url: link,
          summary: description.substring(0, 200),
          publishedAt: publishedAtDate.toISOString(), // Store as ISO string for Chrome Storage compatibility
        });
      }

      return feedItems;
    }, []);
  }
}
