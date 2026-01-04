/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource';
import { FeedItem, SourceType } from '../types/index';
import { SourceRegistry } from './SourceRegistry';

/**
 * EchoJS API response types
 */
interface EchoJSNews {
  id: number;
  title: string;
  url: string;
  atime: number;
  comments: number;
  upvotes: number;
  source: string;
}

interface EchoJSResponse {
  news: EchoJSNews[];
}

/**
 * Data source for EchoJS
 */
export class EchoJSSource extends BaseSource {
  readonly sourceName = 'EchoJS';
  private readonly apiUrl = 'https://www.echojs.com/api/getnews/top/0/30';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const response = await this.safeFetch(this.apiUrl);
        const data: EchoJSResponse = await response.json();

        return data.news.slice(0, count).map((news) => ({
          id: this.generateId(news.id),
          title: news.title,
          source: this.sourceName as SourceType,
          url: news.url,
          summary: news.source || 'EchoJS',
          publishedAt: this.parseTimestamp(news.atime, 's'),
          score: news.upvotes,
          commentCount: news.comments,
          upvotes: news.upvotes,
        }));
      },
      []
    );

    return items;
  }
}

// Auto-register this source
SourceRegistry.register(new EchoJSSource());
