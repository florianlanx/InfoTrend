/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';
import { SourceRegistry } from './SourceRegistry.ts';

/**
 * Data source for GitHub Trending
 * Uses HTML scraping since GitHub doesn't provide an API for trending
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
   */
  private parseGitHubTrendingHTML(html: string, count: number): FeedItem[] {
    const articleRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const articleMatches = [...html.matchAll(articleRegex)];

    return articleMatches.slice(0, count).map((match) => {
      const articleHtml = match[1];
      return this.parseArticle(articleHtml);
    });
  }

  /**
   * Parse a single repository article
   */
  private parseArticle(articleHtml: string): FeedItem {
    // Extract repository name and owner
    const repoLinkMatch = articleHtml.match(/<a[^>]*href="\/([^"]+)"[^>]*>/);
    const repoPath = repoLinkMatch ? repoLinkMatch[1] : '';
    const [owner, repoName] = repoPath.split('/').filter(Boolean);

    // Extract description
    const descMatch = articleHtml.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]*>/g, '').trim()
      : '';

    // Extract programming language
    const langMatch = articleHtml.match(
      /<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/i
    );
    const language = langMatch ? langMatch[1].trim() : '';

    // Extract star count
    const starCount = this.parseStarCount(articleHtml);

    return {
      id: this.generateId(`${owner}-${repoName}`),
      title: `${owner}/${repoName}`,
      source: 'GitHub',
      url: `https://github.com/${owner}/${repoName}`,
      summary: description || `${owner}/${repoName} - ${language}`,
      publishedAt: undefined, // GitHub trending doesn't provide publish date
      tags: language ? [language, 'GitHub Trending'] : ['GitHub Trending'],
      score: starCount,
      upvotes: starCount,
      author: owner,
    };
  }

  /**
   * Parse star count from article HTML
   * Tries multiple patterns to handle GitHub's HTML structure changes
   */
  private parseStarCount(articleHtml: string): number {
    // Pattern 1: Find stargazers link with SVG + number
    const starsMatch1 = articleHtml.match(
      /href="[^"]*\/stargazers"[^>]*>[\s\S]*?<\/svg>\s*([\d,\.]+[km]?)/i
    );

    // Pattern 2: Find octicon-star SVG followed by number
    const starsMatch2 = articleHtml.match(
      /octicon-star[\s\S]*?<\/svg>\s*([\d,\.]+[km]?)/i
    );

    // Pattern 3: Find stargazers link nearby number
    const starsMatch3 = articleHtml.match(/\/stargazers"[^>]*>[\s\S]*?([\d,\.]+[km]?)/i);

    const match = starsMatch1 || starsMatch2 || starsMatch3;
    if (!match) return 0;

    return this.parseNumberWithSuffix(match[1]);
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
