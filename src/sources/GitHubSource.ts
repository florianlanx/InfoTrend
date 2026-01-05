/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import * as cheerio from 'cheerio';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';
import { SourceRegistry } from './SourceRegistry.ts';

/**
 * Data source for GitHub Trending
 * Uses cheerio for stable HTML parsing since GitHub doesn't provide an API for trending
 */
export class GitHubSource extends BaseSource {
  readonly sourceName = 'GitHub';
  private readonly trendingUrl = 'https://github.com/trending?since=daily';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const response = await this.safeFetch(this.trendingUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; InfoTrendExtension/1.0)',
          },
        });
        const html = await response.text();

        return this.parseGitHubTrendingHTML(html, count);
      },
      []
    );

    return items;
  }

  /**
   * Parse GitHub trending HTML and extract repository information
   * Uses cheerio for stable and maintainable HTML parsing
   */
  private parseGitHubTrendingHTML(html: string, count: number): FeedItem[] {
    const $ = cheerio.load(html);
    const articles = $('article.Box-row');

    const items: FeedItem[] = [];

    articles.slice(0, count).each((_, element) => {
      const item = this.parseArticle($, $(element));
      if (item) {
        items.push(item);
      }
    });

    return items;
  }

  /**
   * Parse a single repository article element
   */
  private parseArticle(
    _$: CheerioAPI,
    article: Cheerio<AnyNode>
  ): FeedItem | null {
    // Extract repository link from h2 > a
    const repoLink = article.find('h2 a[href^="/"]').first();
    const href = repoLink.attr('href') || '';

    // Filter out sponsor links and other non-repo paths
    if (
      !href ||
      href.startsWith('/sponsors/') ||
      href.includes('/stargazers') ||
      href.includes('/forks')
    ) {
      return null;
    }

    const parts = href.split('/').filter(Boolean);
    const owner = parts[0] || '';
    const repoName = parts[1] || '';

    if (!owner || !repoName) {
      return null;
    }

    // Extract description
    const descEl = article.find('p.col-9, p.my-1').first();
    const description = descEl.text().trim();

    // Extract programming language
    const langEl = article.find('span[itemprop="programmingLanguage"]').first();
    const language = langEl.text().trim();

    // Extract star count
    const starCount = this.parseStarCount(article);

    return {
      id: this.generateId(`${owner}-${repoName}`),
      title: `${owner}/${repoName}`,
      source: 'GitHub',
      url: `https://github.com/${owner}/${repoName}`,
      summary: description || `${owner}/${repoName} - ${language}`,
      publishedAt: undefined,
      tags: language ? [language, 'GitHub Trending'] : ['GitHub Trending'],
      score: starCount,
      upvotes: starCount,
      author: owner,
    };
  }

  /**
   * Parse star count from article element
   */
  private parseStarCount(article: Cheerio<AnyNode>): number {
    // Find stargazers link and extract the number
    const starLink = article.find('a[href$="/stargazers"]').first();
    if (starLink.length) {
      const text = starLink.text().trim();
      const numMatch = text.match(/([\d,\.]+[km]?)/i);
      if (numMatch) {
        return this.parseNumberWithSuffix(numMatch[1]);
      }
    }

    // Fallback: look for octicon-star nearby
    const starIcon = article.find('.octicon-star').first();
    if (starIcon.length && starIcon.parent().length) {
      const text = starIcon.parent().text().trim();
      const numMatch = text.match(/([\d,\.]+[km]?)/i);
      if (numMatch) {
        return this.parseNumberWithSuffix(numMatch[1]);
      }
    }

    return 0;
  }

  /**
   * Parse number with k/m suffix (e.g., "1.5k", "2m")
   */
  private parseNumberWithSuffix(str: string): number {
    const cleaned = str.replace(/,/g, '').toLowerCase();
    const num = parseFloat(cleaned);

    if (cleaned.endsWith('k')) {
      return Math.round(num * 1000);
    } else if (cleaned.endsWith('m')) {
      return Math.round(num * 1000000);
    }
    return Math.round(num);
  }
}

// Auto-register this source
SourceRegistry.register(new GitHubSource());
