/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { FeedItem } from '../../types/index';

/**
 * Configuration for fetching data from a source
 */
export interface SourceFetchOptions {
  /** Number of items to fetch */
  count?: number;
  /** Additional custom parameters */
  [key: string]: any;
}

/**
 * Base abstract class for all data sources
 * Provides common utilities and enforces consistent interface
 */
export abstract class BaseSource {
  /** Source name (e.g., 'HackerNews', 'GitHub') */
  abstract readonly sourceName: string;

  /** Default fetch count */
  protected defaultCount: number = 10;

  /**
   * Main fetch method - must be implemented by subclasses
   * @param options - Fetch options including count and custom parameters
   * @returns Promise<FeedItem[]> - Array of feed items
   */
  abstract fetch(options?: SourceFetchOptions): Promise<FeedItem[]>;

  /**
   * Safe wrapper for fetch with error handling
   * @param url - URL to fetch
   * @param options - Fetch options
   * @returns Promise<Response> - Fetch response
   * @throws Error if response is not ok
   */
  protected async safeFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`${this.sourceName} API error: ${response.status} ${response.statusText}`);
    }
    return response;
  }

  /**
   * Execute async operation with error handling
   * @param operation - Async operation to execute
   * @param fallback - Fallback value to return on error
   * @returns Promise<T | null> - Operation result or fallback
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${this.sourceName} error:`, error);
      return fallback;
    }
  }

  /**
   * Generate unique ID for a feed item
   * @param identifier - Unique identifier (e.g., article ID)
   * @returns string - Formatted ID (e.g., 'hackernews-123')
   */
  protected generateId(identifier: string | number): string {
    return `${this.sourceName.toLowerCase()}-${identifier}`;
  }

  /**
   * Parse timestamp to ISO string (for Chrome Storage compatibility)
   * Chrome Storage serializes Date objects as objects, so we use ISO strings
   * Supports: ISO 8601, RFC 2822, Unix timestamps (seconds/milliseconds)
   * @param timestamp - Timestamp (string, number, or Date)
   * @param unit - Unit of timestamp ('s' for seconds, 'ms' for milliseconds) - only for numeric values
   * @returns string | undefined - ISO 8601 formatted date string, or undefined if invalid
   */
  protected parseTimestamp(
    timestamp: string | number | Date | undefined | null,
    unit: 's' | 'ms' = 'ms'
  ): string | undefined {
    if (timestamp === undefined || timestamp === null) {
      return undefined;
    }

    let date: Date;

    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(unit === 's' ? timestamp * 1000 : timestamp);
    } else if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      if (!isNaN(parsed)) {
        date = new Date(parsed);
      } else {
        const num = parseInt(timestamp, 10);
        if (!isNaN(num) && String(num) === timestamp.trim()) {
          date = new Date(unit === 's' ? num * 1000 : num);
        } else {
          return undefined;
        }
      }
    } else {
      return undefined;
    }

    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  }

  /**
   * Parse timestamp to Date object (for in-memory operations like sorting/filtering)
   * @param timestamp - Timestamp (string, number, or Date)
   * @param unit - Unit of timestamp ('s' for seconds, 'ms' for milliseconds)
   * @returns Date | undefined - Parsed date object, or undefined if invalid
   */
  protected parseTimestampToDate(
    timestamp: string | number | Date | undefined | null,
    unit: 's' | 'ms' = 'ms'
  ): Date | undefined {
    const isoString = this.parseTimestamp(timestamp, unit);
    return isoString ? new Date(isoString) : undefined;
  }

  /**
   * Clean and truncate string
   * @param str - String to clean
   * @param maxLength - Maximum length (optional)
   * @returns string - Cleaned string
   */
  protected cleanString(str: string, maxLength?: number): string {
    let cleaned = str.replace(/\s+/g, ' ').trim();
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength) + '...';
    }
    return cleaned;
  }

  /**
   * Strip HTML tags from string
   * @param html - HTML string
   * @returns string - Plain text
   */
  protected stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
