/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource';
import { FeedItem, SourceType } from '../types/index';
import { SourceRegistry } from './SourceRegistry';

/**
 * Dev.to API response type
 */
interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  readable_publish_date: string;
  tag_list: string[];
  user: {
    name: string;
    username: string;
  };
  public_reactions_count: number;
  comments_count: number;
}

/**
 * Data source for Dev.to articles
 */
export class DevToSource extends BaseSource {
  readonly sourceName = 'DevTo';
  private readonly apiUrl = 'https://dev.to/api/articles';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const response = await this.safeFetch(`${this.apiUrl}?top=1&per_page=${count}`);
        const data: DevToArticle[] = await response.json();

        return data.map((article) => ({
          id: this.generateId(article.id),
          title: article.title,
          source: this.sourceName as SourceType,
          url: article.url,
          summary: this.cleanString(article.description, 200),
          publishedAt: this.parseTimestamp(article.published_at),
          tags: article.tag_list,
          author: article.user.name,
          score: article.public_reactions_count,
          commentCount: article.comments_count,
        }));
      },
      []
    );

    return items;
  }
}

// Auto-register this source
SourceRegistry.register(new DevToSource());
