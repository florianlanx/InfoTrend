// 数据源类型 - 扩展支持更多数据源
export type SourceType = 
  | 'GitHub' 
  | 'HackerNews' 
  | 'ArXiv' 
  | 'DevTo' 
  | 'Reddit' 
  | 'ProductHunt' 
  | 'EchoJS'
  | 'RSS' 
  | 'Custom';

// 数据源分类
export type SourceCategory = 'ai' | 'dev' | 'news' | 'product' | 'research' | 'community';

// RSS 时间范围类型
export type FetchTimeRange = '1d' | '3d' | '7d' | '30d';

// 时间范围对应的毫秒数
export const TIME_RANGE_MS: Record<FetchTimeRange, number> = {
  '1d': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// 信息条目接口
export interface FeedItem {
  id: string;
  title: string;
  source: SourceType;
  sourceName?: string; // e.g. "Lil's Blog" for RSS
  url: string;
  summary?: string;
  publishedAt?: Date | string; // 可选，某些数据源（如 GitHub Trending）不提供时间
  tags?: string[];
  aiSummary?: string;
  aiSummaryLoading?: boolean; // AI 摘要加载状态
  aiSummaryError?: string; // AI 摘要错误信息
  score?: number;
  author?: string;
  commentCount?: number; // 评论数
  upvotes?: number; // 点赞数
  isPinned?: boolean; // 是否置顶
}

// 数据源配置接口 - 增强版
export interface SourceConfig {
  id: string; // 唯一标识
  type: SourceType;
  url?: string;
  enabled: boolean;
  name: string;
  icon?: string; // 图标
  category: SourceCategory; // 分类
  fetchCount: number; // 获取数量（内置源使用）
  fetchTimeRange?: FetchTimeRange; // RSS 时间范围过滤
  minScore?: number; // 最低分数过滤（如 HN score）
  description?: string; // 数据源描述
  color?: string; // 主题色
  isPinned?: boolean; // 是否置顶
}

// 应用配置接口
export interface AppConfig {
  sources: SourceConfig[];
  // API 配置 - 支持任意 OpenAI 兼容服务
  apiBaseUrl?: string; // API Base URL，如 https://api.openai.com/v1
  apiKey?: string; // API Key
  apiModel?: string; // 模型名称，如 gpt-4o-mini
  theme: 'light' | 'dark';
  maxItems: number;
}

// 默认数据源配置
// 注意：description 字段已移除，展示文本完全由 i18n 系统提供 (source.desc.{id})
export const defaultSources: SourceConfig[] = [
  { 
    id: 'github-trending',
    type: 'GitHub', 
    enabled: true, 
    name: 'GitHub Trending',
    icon: '🐙',
    category: 'dev',
    fetchCount: 10,
    color: '#24292e'
  },
  { 
    id: 'hacker-news',
    type: 'HackerNews', 
    enabled: true, 
    name: 'Hacker News',
    icon: '🔶',
    category: 'news',
    fetchCount: 15,
    minScore: 100,
    color: '#ff6600'
  },
  { 
    id: 'arxiv-ai',
    type: 'ArXiv', 
    enabled: true, 
    name: 'ArXiv AI',
    icon: '📄',
    category: 'research',
    fetchCount: 10,
    color: '#b31b1b'
  },
  { 
    id: 'dev-to',
    type: 'DevTo', 
    enabled: true, 
    name: 'Dev.to',
    icon: '👩‍💻',
    category: 'community',
    fetchCount: 10,
    color: '#0a0a0a'
  },
  { 
    id: 'reddit-ml',
    type: 'Reddit', 
    enabled: true, 
    name: 'Reddit ML',
    icon: '🤖',
    category: 'ai',
    fetchCount: 10,
    color: '#ff4500'
  },
  { 
    id: 'product-hunt',
    type: 'ProductHunt', 
    enabled: true, 
    name: 'Product Hunt',
    icon: '🚀',
    category: 'product',
    fetchCount: 5,
    color: '#da552f'
  },

  { 
    id: 'echo-js',
    type: 'EchoJS', 
    enabled: false, 
    name: 'Echo JS',
    icon: '📢',
    category: 'dev',
    fetchCount: 10,
    color: '#f7df1e'
  },
  { 
    id: 'openai-blog',
    type: 'RSS', 
    enabled: true, 
    name: 'OpenAI Blog',
    icon: '🤖',
    category: 'ai',
    fetchCount: 50,
    fetchTimeRange: '7d',
    url: 'https://openai.com/blog/rss.xml',
    color: '#10a37f'
  },
  { 
    id: 'karpathy-blog',
    type: 'RSS', 
    enabled: true, 
    name: 'Karpathy Blog',
    icon: '🧠',
    category: 'ai',
    fetchCount: 50,
    fetchTimeRange: '30d',
    url: 'https://karpathy.github.io/feed.xml',
    color: '#c93358'
  },
  { 
    id: 'lilian-weng',
    type: 'RSS', 
    enabled: true, 
    name: "Lil'Log",
    icon: '📝',
    category: 'ai',
    fetchCount: 50,
    fetchTimeRange: '30d',
    url: 'https://lilianweng.github.io/index.xml',
    color: '#f28e1c'
  },
  { 
    id: 'hugging-face',
    type: 'RSS', 
    enabled: true, 
    name: 'Hugging Face',
    icon: '🤗',
    category: 'ai',
    fetchCount: 50,
    fetchTimeRange: '7d',
    url: 'https://huggingface.co/blog/feed.xml',
    color: '#ffcc00'
  },
  { 
    id: 'google-ai',
    type: 'RSS', 
    enabled: true, 
    name: 'Google AI',
    icon: '🔵',
    category: 'research',
    fetchCount: 50,
    fetchTimeRange: '7d',
    url: 'https://blog.google/technology/ai/rss/',
    color: '#4285f4'
  },
  { 
    id: 'bair-blog',
    type: 'RSS', 
    enabled: true, 
    name: 'BAIR',
    icon: '🎓',
    category: 'research',
    fetchCount: 50,
    fetchTimeRange: '30d',
    url: 'https://bair.berkeley.edu/blog/feed.xml',
    color: '#003262'
  },
  { 
    id: 'the-gradient',
    type: 'RSS', 
    enabled: true, 
    name: 'The Gradient',
    icon: '📉',
    category: 'ai',
    fetchCount: 50,
    fetchTimeRange: '30d',
    url: 'https://thegradient.pub/rss/',
    color: '#303030'
  },
];

// 默认配置
export const defaultConfig: AppConfig = {
  sources: defaultSources,
  apiBaseUrl: '',
  apiKey: '',
  apiModel: '',
  theme: 'light',
  maxItems: 100, // 增加最大条目数以容纳更多数据源
};

// FeedItem 的助手函数
export function toFeedItem(data: any): FeedItem {
  return {
    ...data,
    publishedAt: typeof data.publishedAt === 'string' ? new Date(data.publishedAt) : data.publishedAt,
  };
}

// 获取数据源图标
export function getSourceIcon(type: SourceType): string {
  const icons: Record<SourceType, string> = {
    GitHub: '🐙',
    HackerNews: '🔶',
    ArXiv: '📄',
    DevTo: '👩‍💻',
    Reddit: '🤖',
    ProductHunt: '🚀',
    EchoJS: '📢',
    RSS: '📰',
    Custom: '🔗',
  };
  return icons[type] || '📰';
}

// 获取数据源颜色
export function getSourceColor(type: SourceType): string {
  const colors: Record<SourceType, string> = {
    GitHub: '#24292e',
    HackerNews: '#ff6600',
    ArXiv: '#b31b1b',
    DevTo: '#0a0a0a',
    Reddit: '#ff4500',
    ProductHunt: '#da552f',
    EchoJS: '#f7df1e',
    RSS: '#ee802f',
    Custom: '#6366f1',
  };
  return colors[type] || '#6366f1';
}

// 分类标签 - 已废弃，请使用 i18n: t(`settings.category.${category}`)
// 保留此对象仅用于向后兼容
export const categoryLabels: Record<SourceCategory, string> = {
  ai: 'AI/ML',
  dev: 'Development',
  news: 'News',
  product: 'Product',
  research: 'Research',
  community: 'Community',
};

