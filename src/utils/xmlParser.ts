/*
 *   Copyright (c) 2025
 *   All rights reserved.
 */
import { XMLParser } from 'fast-xml-parser';

/**
 * XML 解析工具模块
 * 封装 fast-xml-parser 配置，提供统一的 XML 解析能力
 * 用于 Service Worker 环境（无 DOMParser 可用）
 */

// 通用解析器配置
const defaultParserOptions = {
  ignoreAttributes: false,           // 保留属性
  attributeNamePrefix: '@_',         // 属性前缀
  textNodeName: '#text',             // 文本节点名称
  trimValues: true,                  // 去除空白
  parseTagValue: false,              // 不自动转换数值（保持字符串）
  processEntities: true,             // 处理 HTML 实体
  cdataPropName: '__cdata',          // CDATA 属性名
};

// 创建解析器实例
const parser = new XMLParser(defaultParserOptions);

/**
 * 解析 XML 字符串为 JavaScript 对象
 * @param xmlString - XML 字符串
 * @returns 解析后的对象
 */
export function parseXML<T = unknown>(xmlString: string): T {
  return parser.parse(xmlString) as T;
}

// ==================== RSS 解析相关类型 ====================

export interface RSSParsedResult {
  rss?: {
    channel?: RSSChannel;
  };
  // Atom 格式
  feed?: AtomFeed;
}

export interface RSSChannel {
  title?: string | { '#text': string };
  link?: string | { '#text': string; '@_href'?: string };
  description?: string | { '#text': string };
  item?: RSSItem | RSSItem[];
}

export interface RSSItem {
  title?: string | { '#text': string; '__cdata'?: string };
  link?: string | { '#text': string; '@_href'?: string };
  description?: string | { '#text': string; '__cdata'?: string };
  pubDate?: string;
  'dc:date'?: string;
  guid?: string | { '#text': string };
}

// Atom 格式
export interface AtomFeed {
  title?: string | { '#text': string };
  link?: AtomLink | AtomLink[];
  entry?: AtomEntry | AtomEntry[];
}

export interface AtomLink {
  '@_href'?: string;
  '@_rel'?: string;
  '#text'?: string;
}

export interface AtomEntry {
  title?: string | { '#text': string };
  link?: AtomLink | AtomLink[];
  summary?: string | { '#text': string; '__cdata'?: string };
  content?: string | { '#text': string; '__cdata'?: string };
  published?: string;
  updated?: string;
  id?: string;
}

// ==================== ArXiv 解析相关类型 ====================

export interface ArXivParsedResult {
  feed?: {
    entry?: ArXivEntry | ArXivEntry[];
  };
}

export interface ArXivEntry {
  id?: string;
  title?: string | { '#text': string };
  summary?: string | { '#text': string };
  published?: string;
  updated?: string;
  author?: ArXivAuthor | ArXivAuthor[];
  category?: ArXivCategory | ArXivCategory[];
  link?: ArXivLink | ArXivLink[];
}

export interface ArXivAuthor {
  name?: string;
}

export interface ArXivCategory {
  '@_term'?: string;
}

export interface ArXivLink {
  '@_href'?: string;
  '@_rel'?: string;
  '@_type'?: string;
}

// ==================== 工具函数 ====================

/**
 * 从可能的复杂结构中提取文本内容
 * 处理 CDATA、嵌套对象等情况
 */
export function extractText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // 优先取 CDATA 内容
    if (obj['__cdata']) {
      return String(obj['__cdata']).trim();
    }
    // 然后取文本节点
    if (obj['#text']) {
      return String(obj['#text']).trim();
    }
  }
  
  return String(value).trim();
}

/**
 * 从 link 字段提取 URL
 * 处理字符串、对象、数组等多种格式
 */
export function extractLink(value: unknown): string {
  if (!value) return '';
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  // 处理数组（Atom 格式可能有多个 link）
  if (Array.isArray(value)) {
    // 优先找 rel="alternate" 的链接
    const alternate = value.find(
      (l) => l['@_rel'] === 'alternate' || !l['@_rel']
    );
    if (alternate) {
      return alternate['@_href'] || alternate['#text'] || '';
    }
    // 否则返回第一个
    return value[0]?.['@_href'] || value[0]?.['#text'] || '';
  }
  
  // 处理对象
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return String(obj['@_href'] || obj['#text'] || '').trim();
  }
  
  return '';
}

/**
 * 确保返回数组格式
 * 处理单个元素和数组的统一
 */
export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * 清理 HTML 标签，提取纯文本
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  let cleaned = html;
  
  // 移除 script 和 style 标签及内容
  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // 移除所有 HTML 标签
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // 解码常见 HTML 实体
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // 压缩空白
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
}
