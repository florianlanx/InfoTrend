# Data Source Integration Guide

This guide explains how to add new data sources to the Info Trend Chrome Extension.

## Architecture Overview

The new data source architecture uses:
- **BaseSource**: Abstract base class providing common utilities
- **SourceRegistry**: Registry for managing and discovering sources dynamically
- **Auto-registration**: Sources are automatically registered on import

## Quick Start

### Creating a New Data Source

1. Create a new file in `src/sources/` (e.g., `MySource.ts`)
2. Extend `BaseSource` class
3. Implement the `fetch` method
4. Import your source to auto-register it

### Minimal Example

```typescript
// src/sources/MySource.ts
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';
import { SourceRegistry } from './SourceRegistry.ts';

export class MySource extends BaseSource {
  readonly sourceName = 'MySource';
  private readonly apiUrl = 'https://api.example.com/posts';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    const items = await this.safeExecute(
      async () => {
        const response = await this.safeFetch(`${this.apiUrl}?limit=${count}`);
        const data = await response.json();

        return data.map((item) => ({
          id: this.generateId(item.id),
          title: item.title,
          source: this.sourceName as const,
          url: item.url,
          summary: this.cleanString(item.description, 200),
          publishedAt: this.parseTimestamp(item.created_at),
          author: item.author,
        }));
      },
      []
    );

    return items;
  }
}

// Auto-register this source
SourceRegistry.register(new MySource());
```

### Using Your New Source

```typescript
// Import to auto-register
import './sources/MySource.ts';

// Fetch data
import { SourceRegistry } from './sources/index.ts';

const items = await SourceRegistry.fetchFrom('MySource', { count: 10 });
```

## BaseSource API Reference

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `sourceName` | `string` | Unique name for the source (used for ID generation) |

### Required Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `fetch` | `(options?: SourceFetchOptions): Promise<FeedItem[]>` | Fetch and return feed items |

### Protected Utility Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `safeFetch` | `(url: string, options?: RequestInit): Promise<Response>` | Fetch with error handling and response validation |
| `safeExecute` | `<T>(operation: () => Promise<T>, fallback: T): Promise<T>` | Execute async operation with error handling |
| `generateId` | `(identifier: string \| number): string` | Generate unique ID (e.g., `'mysource-123'`) |
| `parseTimestamp` | `(timestamp: string \| number \| Date, unit?: 's' \| 'ms'): Date` | Parse timestamp to Date object |
| `cleanString` | `(str: string, maxLength?: number): string` | Clean and truncate string |
| `stripHtml` | `(html: string): string` | Strip HTML tags from string |

### Protected Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultCount` | `number` | `10` | Default number of items to fetch |

## SourceRegistry API Reference

### Registering Sources

```typescript
// Manual registration
import { MySource } from './sources/MySource.ts';
SourceRegistry.register(new MySource());

// Using decorator (experimental)
@RegisterSource()
class MySource extends BaseSource {
  // ...
}
```

### Fetching Data

```typescript
// Fetch from single source
const items = await SourceRegistry.fetchFrom('MySource', { count: 10 });

// Fetch from multiple sources
const items = await SourceRegistry.fetchFromMany(
  ['MySource', 'DevTo', 'HackerNews'],
  { count: 10 }
);
```

### Managing Registry

```typescript
// Check if source is registered
if (SourceRegistry.has('MySource')) {
  // ...
}

// Get source instance
const source = SourceRegistry.get('MySource');

// Get all registered source names
const names = SourceRegistry.getRegisteredNames();

// Unregister a source
SourceRegistry.unregister('MySource');
```

## FeedItem Structure

All data sources must return `FeedItem[]` with the following structure:

```typescript
interface FeedItem {
  id: string;           // Unique identifier
  title: string;        // Item title
  source: string;       // Source name (use `this.sourceName as const`)
  url: string;          // Item URL
  summary?: string;     // Optional summary/description
  publishedAt: Date;    // Publication date
  tags?: string[];      // Optional tags/categories
  author?: string;      // Optional author name
  score?: number;       // Optional score/rating
  upvotes?: number;     // Optional upvotes
  commentCount?: number; // Optional comment count
}
```

## Common Patterns

### Handling JSON API

```typescript
async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
  const count = options.count ?? this.defaultCount;

  return await this.safeExecute(async () => {
    const response = await this.safeFetch(`${this.apiUrl}?limit=${count}`);
    const data = await response.json();

    return data.map((item) => ({
      id: this.generateId(item.id),
      title: item.title,
      source: this.sourceName as const,
      url: item.url,
      publishedAt: this.parseTimestamp(item.created_at),
    }));
  }, []);
}
```

### Handling RSS Feed

```typescript
async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
  const count = options.count ?? this.defaultCount;

  return await this.safeExecute(async () => {
    const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this.rssUrl)}`;
    const response = await this.safeFetch(rssUrl);
    const data = await response.json();

    return data.items.slice(0, count).map((item) => ({
      id: this.generateId(`${item.title}-${item.pubDate}`),
      title: item.title,
      source: this.sourceName as const,
      url: item.link,
      summary: this.cleanString(this.stripHtml(item.description), 200),
      publishedAt: this.parseTimestamp(item.pubDate),
    }));
  }, []);
}
```

### Handling HTML Scraping

```typescript
async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
  const count = options.count ?? this.defaultCount;

  return await this.safeExecute(async () => {
    const response = await this.safeFetch(this.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InfoTrend/1.0)' },
    });
    const html = await response.text();

    // Parse HTML using regex (since DOMParser is not available in Service Worker)
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const matches = [...html.matchAll(articleRegex)];

    return matches.slice(0, count).map((match) => {
      const articleHtml = match[1];
      const title = this.extractText(articleHtml, /<h2[^>]*>([^<]+)<\/h2>/);
      const url = this.extractAttr(articleHtml, /<a[^>]*href="([^"]*)"/);

      return {
        id: this.generateId(`${Date.now()}-${Math.random()}`),
        title,
        source: this.sourceName as const,
        url,
        publishedAt: new Date(),
      };
    });
  }, []);
}

private extractText(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return match ? match[1] : '';
}

private extractAttr(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return match ? match[1] : '';
}
```

### Handling Pagination

```typescript
async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
  const count = options.count ?? this.defaultCount;
  const allItems: FeedItem[] = [];
  let page = 1;

  while (allItems.length < count) {
    const response = await this.safeFetch(`${this.apiUrl}?page=${page}`);
    const data = await response.json();

    if (data.items.length === 0) break;

    const items = data.items.map((item) => ({
      id: this.generateId(item.id),
      title: item.title,
      source: this.sourceName as const,
      url: item.url,
      publishedAt: this.parseTimestamp(item.created_at),
    }));

    allItems.push(...items);

    if (data.items.length < data.per_page) break;
    page++;
  }

  return allItems.slice(0, count);
}
```

### Handling Authentication

```typescript
async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
  const apiKey = options.apiKey || this.defaultApiKey;

  return await this.safeExecute(async () => {
    const response = await this.safeFetch(this.apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    return data.map((item) => ({
      id: this.generateId(item.id),
      title: item.title,
      source: this.sourceName as const,
      url: item.url,
      publishedAt: this.parseTimestamp(item.created_at),
    }));
  }, []);
}
```

## Best Practices

1. **Use Utility Methods**: Leverage `safeFetch`, `safeExecute`, `generateId`, etc.
2. **Error Handling**: Always wrap fetch logic in `safeExecute`
3. **Type Safety**: Define TypeScript interfaces for API responses
4. **ID Generation**: Use `generateId` for consistent ID format
5. **Date Parsing**: Use `parseTimestamp` to handle various date formats
6. **String Cleaning**: Use `cleanString` and `stripHtml` for text processing
7. **Configuration**: Support `count` parameter for flexible fetching
8. **Auto-registration**: Call `SourceRegistry.register` at the end of your source file

## Testing Your Source

```typescript
// Test your source
import { MySource } from './sources/MySource.ts';

const source = new MySource();
const items = await source.fetch({ count: 5 });

console.log(`Fetched ${items.length} items from ${source.sourceName}`);
console.log(items[0]);
```

## Migration Guide (From Old Architecture)

If you're migrating an old data source:

1. Rename file from `fetchMySource.ts` to `MySource.ts`
2. Change from function to class extending `BaseSource`
3. Move `fetchMySource(count)` logic to `fetch(options)` method
4. Replace manual error handling with `safeExecute`
5. Replace manual fetch with `safeFetch`
6. Use utility methods: `generateId`, `parseTimestamp`, `cleanString`
7. Add auto-registration at the end
8. Remove manual import from `dataFetcher.ts`
9. Import new source in `src/sources/index.ts`

### Before (Old Architecture)

```typescript
// src/sources/mySource.ts
import { FeedItem } from '../types/index.ts';

export async function fetchMySource(count: number = 10): Promise<FeedItem[]> {
  try {
    const response = await fetch('https://api.example.com/posts?limit=' + count);
    if (!response.ok) {
      throw new Error(`MySource API error: ${response.status}`);
    }
    const data = await response.json();

    return data.map((item) => ({
      id: `mysource-${item.id}`,
      title: item.title,
      source: 'MySource' as const,
      url: item.url,
      publishedAt: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('MySource fetch error:', error);
    return [];
  }
}
```

### After (New Architecture)

```typescript
// src/sources/MySource.ts
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';
import { SourceRegistry } from './SourceRegistry.ts';

export class MySource extends BaseSource {
  readonly sourceName = 'MySource';
  private readonly apiUrl = 'https://api.example.com/posts';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;

    return await this.safeExecute(async () => {
      const response = await this.safeFetch(`${this.apiUrl}?limit=${count}`);
      const data = await response.json();

      return data.map((item) => ({
        id: this.generateId(item.id),
        title: item.title,
        source: this.sourceName as const,
        url: item.url,
        publishedAt: this.parseTimestamp(item.created_at),
      }));
    }, []);
  }
}

// Auto-register this source
SourceRegistry.register(new MySource());
```

## Examples

See existing sources in `src/sources/` for reference:

- `DevToSource.ts` - Simple JSON API
- `HackerNewsSource.ts` - Two-stage fetch (IDs → details)
- `GitHubSource.ts` - HTML scraping with regex
- `ProductHuntSource.ts` - RSS to JSON conversion
- `ArXivSource.ts` - XML parsing with regex

## Contributing

When adding a new source:

1. Create your source file following the patterns above
2. Add it to `src/sources/index.ts` exports
3. Update this documentation if needed
4. Test your source thoroughly
5. Submit a pull request

## Troubleshooting

### Source Not Found

Make sure you import your source file to trigger auto-registration:

```typescript
// In your main file
import './sources/MySource.ts';  // This triggers registration
```

### CORS Errors

If you encounter CORS errors, consider:
- Using a CORS proxy (like `cors-anywhere`)
- Using a JSON-to-RSS service (like `rss2json.com`)
- Checking if the API provides a CORS-enabled endpoint

### Service Worker Limitations

Remember that Service Workers have limitations:
- No DOMParser available (use regex for HTML/XML parsing)
- No localStorage available
- Limited console access

### Memory Issues

For large datasets:
- Use pagination
- Limit the number of items fetched
- Avoid storing large objects in cache

## Support

For questions or issues, please open an issue on GitHub.
