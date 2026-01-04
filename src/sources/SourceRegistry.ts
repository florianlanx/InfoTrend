/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { BaseSource, SourceFetchOptions } from './base/BaseSource.ts';
import { FeedItem } from '../types/index.ts';

/**
 * Registry for managing data sources
 * Supports dynamic registration and retrieval
 */
export class SourceRegistry {
  private static sources = new Map<string, BaseSource>();

  /**
   * Register a data source
   * @param source - Source instance to register
   * @throws Error if source with same name already exists
   */
  static register(source: BaseSource): void {
    const key = source.sourceName;
    if (this.sources.has(key)) {
      throw new Error(`Source ${key} is already registered`);
    }
    this.sources.set(key, source);
  }

  /**
   * Unregister a data source
   * @param name - Source name to unregister
   */
  static unregister(name: string): void {
    this.sources.delete(name);
  }

  /**
   * Get a registered source by name
   * @param name - Source name
   * @returns BaseSource | undefined - Source instance or undefined
   */
  static get(name: string): BaseSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Check if a source is registered
   * @param name - Source name
   * @returns boolean - True if registered
   */
  static has(name: string): boolean {
    return this.sources.has(name);
  }

  /**
   * Get all registered source names
   * @returns string[] - Array of source names
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Fetch data from a specific source
   * @param name - Source name
   * @param options - Fetch options
   * @returns Promise<FeedItem[]> - Array of feed items or empty array on error
   */
  static async fetchFrom(name: string, options?: SourceFetchOptions): Promise<FeedItem[]> {
    const source = this.get(name);
    if (!source) {
      console.error(`Source ${name} not found in registry`);
      return [];
    }
    try {
      return await source.fetch(options);
    } catch (error) {
      console.error(`Error fetching from ${name}:`, error);
      return [];
    }
  }

  /**
   * Fetch data from multiple sources in parallel
   * @param sourceNames - Array of source names
   * @param options - Fetch options (applied to all sources)
   * @returns Promise<FeedItem[]> - Combined array of feed items
   */
  static async fetchFromMany(
    sourceNames: string[],
    options?: SourceFetchOptions
  ): Promise<FeedItem[]> {
    const results = await Promise.allSettled(
      sourceNames.map(name => this.fetchFrom(name, options))
    );

    const allItems: FeedItem[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allItems.push(...result.value);
      }
    });

    return allItems;
  }

  /**
   * Clear all registered sources
   * Note: Use with caution, primarily for testing
   */
  static clear(): void {
    this.sources.clear();
  }

  /**
   * Get the count of registered sources
   * @returns number - Number of registered sources
   */
  static size(): number {
    return this.sources.size;
  }
}

/**
 * Decorator to auto-register a class as a source
 * Usage: @RegisterSource()
 */
export function RegisterSource() {
  return function<T extends { new (...args: any[]): BaseSource }>(constructor: T) {
    const instance = new constructor();
    SourceRegistry.register(instance);
    return constructor;
  };
}
