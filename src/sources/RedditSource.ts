/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource';
import { FeedItem, SourceType } from '../types/index';
import { SourceRegistry } from './SourceRegistry';

/**
 * Reddit API response types
 */
interface RedditPostData {
  id: string;
  title: string;
  url: string;
  selftext: string;
  is_self: boolean;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
  author: string;
}

interface RedditChild {
  data: RedditPostData;
}

interface RedditResponse {
  data: {
    children: RedditChild[];
  };
}

/**
 * Data source for Reddit (MachineLearning subreddit)
 */
export class RedditSource extends BaseSource {
  readonly sourceName = 'Reddit';
  private readonly apiUrl = 'https://www.reddit.com/r/MachineLearning/hot.json';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const response = await this.safeFetch(this.apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; InfoTrendExtension/1.0)',
          },
        });
        const data: RedditResponse = await response.json();

        const posts = data.data.children
          .filter((post) => !post.data.is_self || post.data.selftext)
          .slice(0, count);

        return posts.map((post) => ({
          id: this.generateId(post.data.id),
          title: post.data.title,
          source: this.sourceName as SourceType,
          url: post.data.is_self
            ? `https://www.reddit.com${post.data.permalink}`
            : post.data.url,
          summary: post.data.selftext
            ? this.cleanString(post.data.selftext, 300)
            : undefined,
          publishedAt: this.parseTimestamp(post.data.created_utc, 's'),
          author: post.data.author,
          score: post.data.score,
          commentCount: post.data.num_comments,
          tags: ['Machine Learning'],
        }));
      },
      []
    );

    return items;
  }
}

// Auto-register this source
SourceRegistry.register(new RedditSource());
