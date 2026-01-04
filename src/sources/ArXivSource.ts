/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';
import { SourceRegistry } from './SourceRegistry.ts';
import {
  parseXML,
  ArXivParsedResult,
  ArXivEntry,
  extractText,
  ensureArray,
} from '../utils/xmlParser.ts';

/**
 * Data source for ArXiv papers
 */
export class ArXivSource extends BaseSource {
  readonly sourceName = 'ArXiv';
  private readonly apiUrl = 'http://export.arxiv.org/api/query';
  private readonly defaultQuery = 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL';

  async fetch(options: SourceFetchOptions = {}): Promise<FeedItem[]> {
    const count = options.count ?? this.defaultCount;
    const query = options.query ?? this.defaultQuery;

    return this.safeExecute(async () => {
      // sortBy=submittedDate 按提交日期排序，sortOrder=descending 最新的在前
      const response = await this.safeFetch(
        `${this.apiUrl}?search_query=${encodeURIComponent(query)}&start=0&max_results=${count}&sortBy=submittedDate&sortOrder=descending`
      );
      const text = await response.text();

      // 使用 fast-xml-parser 解析 XML
      const parsed = parseXML<ArXivParsedResult>(text);
      const entries = ensureArray(parsed.feed?.entry);

      return entries.map((entry: ArXivEntry): FeedItem => {
        const id = extractText(entry.id);
        const arxivId = id.split('/').pop() || id;
        const title = extractText(entry.title);
        const summary = extractText(entry.summary);
        const published = entry.published || '';
        
        // 提取分类标签
        const categories = ensureArray(entry.category)
          .map((cat) => cat['@_term'] || '')
          .filter(Boolean);
        
        // 提取作者
        const authors = ensureArray(entry.author)
          .map((author) => author.name || '')
          .filter(Boolean);

        return {
          id: this.generateId(arxivId),
          title: this.cleanString(title),
          source: 'ArXiv',
          url: id,
          summary: this.cleanString(summary, 300),
          publishedAt: this.parseTimestamp(published),
          tags: categories.map((cat) => cat.split('.').pop() || cat),
          author: authors.join(', '),
        };
      });
    }, []);
  }
}

// Auto-register this source
SourceRegistry.register(new ArXivSource());
