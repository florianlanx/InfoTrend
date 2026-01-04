/**
 * AI Service - 统一的 AI 服务模块
 * 
 * 包含：
 * - LLM 配置管理
 * - AI 摘要生成
 * - AI 标签生成
 */

import { FeedItem } from '../types/index.ts';
import { AITagResponse } from '../types/favorite';
import { getCache, saveCache, getConfig } from './storage.ts';
import { getStoredLocale } from '../i18n/storage.ts';
import { ActualLocale } from '../i18n/types.ts';
import { detectBrowserLocale } from '../i18n/detector.ts';

// ============================================================================
// 类型定义
// ============================================================================

interface LLMConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

// 流式响应回调类型
type StreamCallback = (chunk: string) => void;

// ============================================================================
// 错误类
// ============================================================================

/**
 * API 未配置错误
 */
export class APINotConfiguredError extends Error {
  constructor() {
    super('API 未配置，请前往设置页面配置 API');
    this.name = 'APINotConfiguredError';
  }
}

// ============================================================================
// 常量配置
// ============================================================================

// 语言名称映射
const LANGUAGE_NAMES: Record<ActualLocale, string> = {
  'zh-CN': '中文',
  'en-US': 'English',
};

// 摘要缓存配置
const SUMMARY_CACHE_PREFIX = 'ai_summary_';
const SUMMARY_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

// 标签缓存配置
const TAGS_CACHE_PREFIX = 'ai_tags_';
const TAGS_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天

// 预定义分类列表
const PREDEFINED_CATEGORIES = [
  'AI', 'Development', 'News', 'Research', 'Product', 'Tutorial', 'Other',
] as const;

// ============================================================================
// 基础设施函数
// ============================================================================

/**
 * 获取用户语言设置
 */
async function getUserLanguage(): Promise<string> {
  const locale = await getStoredLocale();
  // 如果是 auto 或未设置，使用系统语言检测
  if (!locale || locale === 'auto') {
    const systemLocale = detectBrowserLocale();
    return LANGUAGE_NAMES[systemLocale] || '中文';
  }
  if (locale in LANGUAGE_NAMES) {
    return LANGUAGE_NAMES[locale as ActualLocale];
  }
  // 默认返回中文
  return '中文';
}

/**
 * 获取 LLM 配置
 * 从用户配置中读取 baseUrl、apiKey、model
 */
async function getLLMConfig(): Promise<LLMConfig | null> {
  const config = await getConfig();
  
  // 检查是否配置了必要的字段
  if (!config.apiBaseUrl || !config.apiKey || !config.apiModel) {
    return null;
  }
  
  // 规范化 baseUrl
  let baseUrl = config.apiBaseUrl.trim();
  
  // 移除末尾斜杠
  while (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // 如果 baseUrl 已经以 /chat/completions 结尾，不再添加
  if (!baseUrl.endsWith('/chat/completions')) {
    baseUrl = `${baseUrl}/chat/completions`;
  }
  
  return {
    apiKey: config.apiKey,
    model: config.apiModel,
    baseUrl,
  };
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为网络错误
 */
function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'Failed to fetch',
    'Network request failed',
    'NetworkError',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_CHANGED',
  ];
  return networkErrorMessages.some(msg => error.message.includes(msg));
}

// ============================================================================
// LLM API 调用
// ============================================================================

/**
 * 调用 LLM API（非流式）
 * 带重试机制
 */
async function callLLM(
  prompt: string, 
  config: LLMConfig, 
  options: {
    maxRetries?: number;
    retryDelay?: number;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string | null> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    temperature = 0.7,
    maxTokens = 500,
  } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      };
      
      const response = await fetch(config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorDetail = errorData.error.message;
          } else if (typeof errorData.error === 'string') {
            errorDetail = errorData.error;
          }
        } catch {
          // 无法解析 JSON，使用状态码
        }

        // 429 (Too Many Requests) - 需要重试
        if (response.status === 429 && attempt < maxRetries) {
          console.warn(`[AI Service] Rate limited, retrying in ${retryDelay * (attempt + 1)}ms`);
          await sleep(retryDelay * (attempt + 1));
          continue;
        }

        // 5xx 错误 - 服务器错误，可以重试
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[AI Service] Server error ${response.status}, retrying...`);
          await sleep(retryDelay * (attempt + 1));
          continue;
        }

        throw new Error(`API 请求失败: ${errorDetail}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 网络错误 - 可以重试
      if (isNetworkError(lastError) && attempt < maxRetries) {
        await sleep(retryDelay * (attempt + 1));
        continue;
      }

      // 其他错误 - 直接抛出
      throw lastError;
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError || new Error('AI 服务调用失败');
}

/**
 * 调用 LLM API（流式响应）
 */
async function callLLMStream(
  prompt: string, 
  config: LLMConfig, 
  onStream?: StreamCallback
): Promise<string | null> {
  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码数据并添加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按行分割处理 SSE 数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              fullText += content;
              // 调用流式回调
              if (onStream) {
                onStream(fullText);
              }
            }
          } catch {
            // 跳过无法解析的 SSE 行
          }
        }
      }
    }

    return fullText || null;
  } catch (error) {
    // 提供更详细的错误信息
    if (error instanceof TypeError && (error as Error).message === 'Failed to fetch') {
      throw new Error('网络请求失败，请检查 API URL 是否正确，以及网络连接是否正常');
    }
    throw error;
  }
}

// ============================================================================
// 摘要生成服务
// ============================================================================

/**
 * 构建摘要生成 prompt
 */
function buildSummaryPrompt(item: FeedItem, language: string): string {
  return `请为以下技术内容生成一个简洁的摘要（50-100字），突出关键信息和价值点：

标题: ${item.title}
来源: ${item.source}
链接: ${item.url}
${item.summary ? `原文摘要: ${item.summary.slice(0, 500)}` : ''}
${item.tags?.length ? `标签: ${item.tags.join(', ')}` : ''}

要求：
1. 使用${language}输出
2. 简洁明了，突出核心价值
3. 如果是代码库，说明其用途和亮点
4. 如果是论文，说明研究贡献
5. 如果是文章，说明主要观点

请直接返回摘要内容，不要包含任何前缀或格式标记。`;
}

/**
 * 为单条内容生成 AI 摘要（按需触发，流式输出）
 * @param item 需要生成摘要的条目
 * @param onStream 流式响应回调函数，每收到一段内容就调用
 * @param skipCache 是否跳过缓存
 * @returns 生成的摘要文本，如果 API 未配置则抛出 APINotConfiguredError
 */
export async function generateSummary(
  item: FeedItem, 
  onStream?: StreamCallback, 
  skipCache: boolean = false
): Promise<string> {
  const cacheKey = `${SUMMARY_CACHE_PREFIX}${item.id}`;
  
  // 检查缓存（如果不跳过缓存）
  if (!skipCache) {
    const cachedSummary = await getCache(cacheKey);

    if (cachedSummary && Date.now() - cachedSummary.timestamp < SUMMARY_CACHE_DURATION) {
      // 从缓存中模拟打字机效果输出
      if (onStream) {
        const cachedText = cachedSummary.summary;
        // 模拟打字机效果，每次输出一小段
        const chunkSize = 3; // 每次输出3个字符
        for (let i = 0; i < cachedText.length; i += chunkSize) {
          const chunk = cachedText.slice(0, i + chunkSize);
          onStream(chunk);
          // 短暂延迟模拟打字效果
          await new Promise(resolve => setTimeout(resolve, 15));
        }
        // 确保最终输出完整内容
        onStream(cachedText);
      }
      return cachedSummary.summary;
    }
  }

  // 获取 LLM 配置
  const config = await getLLMConfig();

  if (!config) {
    throw new APINotConfiguredError();
  }

  try {
    // 获取用户语言设置
    const language = await getUserLanguage();
    const prompt = buildSummaryPrompt(item, language);
    const response = await callLLMStream(prompt, config, onStream);

    if (response) {
      const summary = response.trim();

      // 缓存摘要
      await saveCache(cacheKey, {
        summary,
        timestamp: Date.now(),
      });

      return summary;
    }

    throw new Error('AI 返回内容为空');
  } catch (error) {
    if (error instanceof APINotConfiguredError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'AI 摘要生成失败';
    throw new Error(errorMessage);
  }
}

// 兼容旧 API 名称
export const generateSingleSummary = generateSummary;

// ============================================================================
// 标签生成服务
// ============================================================================

/**
 * 构建标签生成 prompt
 */
function buildTagsPrompt(content: string, language: string): string {
  return `请为以下技术内容生成3-5个相关标签和1个分类：

内容：
${content}

分类选项（必须从中选择）：
- AI: AI/机器学习/深度学习相关
- Development: 编程/开发工具/框架相关
- News: 技术新闻/行业动态
- Research: 学术研究/论文/实验
- Product: 产品发布/工具推荐
- Tutorial: 教程/指南/文档
- Other: 其他分类

要求：
1. 使用${language}输出标签
2. 标签应该简洁、具体、有价值
3. 每个标签1-3个词
4. 只选择一个分类
5. 标签应该反映内容的核心价值

返回格式（JSON）：
{
  "tags": ["标签1", "标签2", "标签3"],
  "category": "AI"
}

请只返回JSON，不要包含其他内容。`;
}

/**
 * 清理 AI 响应中的 markdown 代码块标记
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();
  
  // 移除 markdown 代码块标记 ```json ... ``` 或 ``` ... ```
  // 使用非贪婪匹配，支持不完整的代码块
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:\s*```|$)/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  
  // 尝试找到 JSON 对象的开始和结束
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }
  
  return cleaned;
}

/**
 * 解析 AI 返回的标签响应
 */
function parseTagsResponse(response: string): AITagResponse {
  // 先清理响应中的 markdown 标记
  const cleanedResponse = cleanJsonResponse(response);
  
  try {
    // 尝试解析清理后的 JSON
    const parsed = JSON.parse(cleanedResponse);
    
    if (Array.isArray(parsed.tags) && typeof parsed.category === 'string') {
      // 验证分类是否在预定义列表中
      const validCategory = PREDEFINED_CATEGORIES.includes(parsed.category as any)
        ? parsed.category
        : 'Other';
      
      return {
        tags: parsed.tags.filter((tag: string) => tag && tag.trim().length > 0).slice(0, 5),
        category: validCategory,
      };
    }
  } catch {
    // 解析失败，使用回退方案
  }

  // 回退解析：尝试从文本中提取
  return extractTagsFromText(response);
}

/**
 * 从文本中提取标签（回退方案）
 */
function extractTagsFromText(text: string): AITagResponse {
  const tags: string[] = [];
  let category = 'Other';

  // 尝试提取 tags 数组
  const tagsMatch = text.match(/["']tags["']\s*:\s*\[(.*?)\]/);
  if (tagsMatch) {
    const tagsContent = tagsMatch[1];
    const tagMatches = tagsContent.match(/["']([^"']+)["']/g);
    if (tagMatches) {
      tags.push(...tagMatches.map(t => t.replace(/["']/g, '')));
    }
  }

  // 尝试提取 category
  const categoryMatch = text.match(/["']category["']\s*:\s*["']([^"']+)["']/);
  if (categoryMatch) {
    const matchedCategory = categoryMatch[1];
    if (PREDEFINED_CATEGORIES.includes(matchedCategory as any)) {
      category = matchedCategory;
    }
  }

  // 如果没有提取到标签，返回空数组而不是从内容生成
  return {
    tags: tags.slice(0, 5),
    category,
  };
}

/**
 * 生成标签和分类
 * @param content 内容文本（标题+摘要）
 * @param skipCache 是否跳过缓存
 * @returns 标签和分类信息
 */
export async function generateTags(content: string, skipCache: boolean = false): Promise<AITagResponse> {
  // 生成内容的哈希作为缓存键
  const cacheKey = `${TAGS_CACHE_PREFIX}${btoa(encodeURIComponent(content)).slice(0, 32)}`;

  // 检查缓存
  if (!skipCache) {
    const cached = await getCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < TAGS_CACHE_DURATION) {
      return cached.result;
    }
  }

  // 获取 LLM 配置
  const config = await getLLMConfig();

  if (!config) {
    throw new APINotConfiguredError();
  }

  try {
    // 获取用户语言设置
    const language = await getUserLanguage();
    const prompt = buildTagsPrompt(content, language);
    // 标签生成不需要流式，使用非流式调用，增加 maxTokens 确保完整输出
    const response = await callLLM(prompt, config, {
      temperature: 0.5,
      maxTokens: 1000, // 增加到 1000 确保不被截断
    });

    if (response) {
      const parsedResponse = parseTagsResponse(response);

      // 缓存结果
      await saveCache(cacheKey, {
        result: parsedResponse,
        timestamp: Date.now(),
      });

      return parsedResponse;
    }

    throw new Error('AI 返回内容为空');
  } catch (error) {
    if (error instanceof APINotConfiguredError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'AI 标签生成失败';
    throw new Error(errorMessage);
  }
}

// ============================================================================
// 推荐服务
// ============================================================================

/**
 * 获取 AI 推荐的热点内容
 */
export async function getRecommendations(items: FeedItem[]): Promise<FeedItem[]> {
  if (items.length === 0) return [];

  // 获取 LLM 配置
  const config = await getLLMConfig();
  
  if (!config) {
    // API 未配置，返回前 5 条
    return items.slice(0, 5);
  }

  try {
    const itemsList = items.slice(0, 20).map((item, index) =>
      `${index + 1}. ${item.title} - ${item.source}`
    ).join('\n');

    const prompt = `从以下20条技术热点中，选择5条最值得关注的（对于AI开发者或技术工程师），返回索引号（1-20）：

${itemsList}

返回格式：["1", "5", "8", "12", "16"]
请只返回JSON数组，不要包含其他内容。`;

    const response = await callLLM(prompt, config);

    if (response) {
      try {
        const indices = JSON.parse(response);
        if (Array.isArray(indices)) {
          return indices.map(i => items[parseInt(i) - 1]).filter(Boolean);
        }
      } catch {
        // 解析失败，使用默认推荐
      }
    }
  } catch {
    // 推荐生成失败，使用默认推荐
  }

  return items.slice(0, 5);
}
