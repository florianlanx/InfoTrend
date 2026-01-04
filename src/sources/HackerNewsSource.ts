/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource';
import { FeedItem, SourceType } from '../types/index';
import { SourceRegistry } from './SourceRegistry';

/**
 * HackerNews API response type
 */
interface HackerNewsItem {
  id: number;
  title: string;
  url: string | null;
  by: string;
  time: number;
  score: number;
  descendants: number;
  text: string | null;
}

/**
 * Data source for HackerNews
 */
export class HackerNewsSource extends BaseSource {
  readonly sourceName = 'HackerNews';
  private readonly apiBase = 'https://hacker-news.firebaseio.com/v0';
  private readonly topStoriesUrl = `${this.apiBase}/topstories.json`;
  protected defaultCount = 15;

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;
    const minScore = options.minScore ?? 100;

    const items = await this.safeExecute(
      async () => {
        // Get top story IDs
        const storiesResponse = await this.safeFetch(this.topStoriesUrl);
        const storyIds: number[] = await storiesResponse.json();

        // Fetch more stories to filter by score
        const fetchCount = Math.min(count * 3, 100);
        const topStoryIds = storyIds.slice(0, fetchCount);

        // Fetch item details in parallel
        const items = await Promise.all(
          topStoryIds.map(async (id) => {
            const response = await this.safeFetch(`${this.apiBase}/item/${id}.json`);
            return await response.json() as HackerNewsItem;
          })
        );

        // Filter and map items
        return items
          .filter((item) => item.score >= minScore)
          .slice(0, count)
          .map((item) => ({
            id: this.generateId(item.id),
            title: item.title,
            source: this.sourceName as SourceType,
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            summary: item.text ? this.cleanString(item.text, 200) : undefined,
            publishedAt: this.parseTimestamp(item.time, 's'),
            author: item.by,
            score: item.score,
            commentCount: item.descendants,
          }));
      },
      []
    );

    return items;
  }
}

// Auto-register this source
SourceRegistry.register(new HackerNewsSource());
