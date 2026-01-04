/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Star, MessageSquare, Sparkles, Loader2, AlertCircle, Settings, X, RefreshCw, Pin } from 'lucide-react';
import { FeedItem, SourceType } from '@/types/index.ts';
import { cn } from '@/lib/utils.ts';
import { safeTabsCreate } from '@/utils/chrome.ts';
import { getBrandIcon } from '@/components/icons/BrandIcons.tsx';
import { useI18n } from '@/i18n';
import { generateSummary, APINotConfiguredError } from '@/services/aiService.ts';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { FavoriteButton } from '@/components/FavoriteButton';
import { TagList } from '@/components/TagList';

interface FeedListProps {
  feeds: FeedItem[];
  onFeedUpdate?: (feed: FeedItem) => void;
}

const SOURCE_COLORS: Record<SourceType, string> = {
  GitHub: 'bg-gray-800',
  HackerNews: 'bg-orange-500',
  ArXiv: 'bg-red-700',
  DevTo: 'bg-gray-900',
  Reddit: 'bg-orange-600',
  ProductHunt: 'bg-orange-500',
  EchoJS: 'bg-yellow-500',
  RSS: 'bg-green-500',
  Custom: 'bg-indigo-500',
};

interface ErrorInfo {
  type: string;
  message: string;
}

interface ErrorDialogState {
  isOpen: boolean;
  errorType: string;
  errorMessage: string;
}

function FeedList({ feeds, onFeedUpdate }: FeedListProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Map<string, ErrorInfo>>(new Map()); // 存储错误信息
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    isOpen: false,
    errorType: '',
    errorMessage: '',
  });
  const { t } = useI18n();

  // 收藏相关状态
  const favorites = useFavoriteStore((state) => state.favorites);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const regenerateTags = useFavoriteStore((state) => state.regenerateTags);
  // 标签生成中的 ID 集合（包括首次收藏时生成）
  const [tagsLoadingIds, setTagsLoadingIds] = useState<Set<string>>(new Set());

  // 当 feeds 变化时（刷新资讯），清除所有错误状态
  useEffect(() => {
    setErrorIds(new Map());
  }, [feeds]);

  // 格式化数字为 k/m 格式
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn('[FeedList] Invalid date encountered:', date, 'Type:', typeof date);
      return '';
    }
    
    const now = new Date();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // 跨年时显示年份
    if (dateObj.getFullYear() !== now.getFullYear()) {
      return `${dateObj.getFullYear()}年${month}月${day}日`;
    }
    
    return `${month}月${day}日`;
  };

  const handleFeedClick = (url: string, e: React.MouseEvent) => {
    // 如果点击的是按钮或 AI 摘要/错误卡片区域，不触发跳转
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-navigate]')) {
      return;
    }
    safeTabsCreate({ url });
  };

  // 打开设置页面
  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 打开扩展的设置页面
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // 备用方案：直接打开 options.html
      safeTabsCreate({ url: chrome.runtime.getURL('options.html') });
    }
  };

  // 关闭错误弹窗
  const handleCloseErrorDialog = () => {
    setErrorDialog(prev => ({ ...prev, isOpen: false }));
  };

  // 弹窗中打开设置
  const handleDialogOpenSettings = () => {
    handleCloseErrorDialog();
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      safeTabsCreate({ url: chrome.runtime.getURL('options.html') });
    }
  };

  const handleGenerateSummary = async (feed: FeedItem, e: React.MouseEvent, skipCache: boolean = false) => {
    e.stopPropagation();

    if (loadingIds.has(feed.id)) return;

    // 清除之前的错误
    setErrorIds(prev => {
      const next = new Map(prev);
      next.delete(feed.id);
      return next;
    });

    setLoadingIds(prev => new Set(prev).add(feed.id));

    try {
      // 调用 AI 服务生成摘要，支持流式响应
      const finalSummary = await generateSummary(feed, (streamChunk) => {
        // 流式更新摘要内容
        if (onFeedUpdate) {
          onFeedUpdate({
            ...feed,
            aiSummary: streamChunk
          });
        }
      }, skipCache);

      // 成功后确保最终摘要被保存
      if (onFeedUpdate) {
        onFeedUpdate({
          ...feed,
          aiSummary: finalSummary,
          aiSummaryLoading: false
        });
      }
    } catch (error) {
      console.error('[FeedList] Generate AI summary error:', error);

      // 清除加载状态
      if (onFeedUpdate) {
        onFeedUpdate({
          ...feed,
          aiSummaryLoading: false
        });
      }

      // 处理错误
      const isAPINotConfigured = error instanceof APINotConfiguredError;
      const errorType = isAPINotConfigured ? 'API_NOT_CONFIGURED' : 'UNKNOWN';
      const errorMessage = isAPINotConfigured
        ? t('feed.apiNotConfigured')
        : (error instanceof Error ? error.message : t('feed.summaryError'));

      setErrorIds(prev => {
        const next = new Map(prev);
        next.set(feed.id, { type: errorType, message: errorMessage });
        return next;
      });

      // 弹出错误对话框引导用户检查配置
      setErrorDialog({
        isOpen: true,
        errorType,
        errorMessage,
      });

      console.error('Summary generation failed:', errorMessage);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(feed.id);
        return next;
      });
    }
  };

  // 处理收藏切换
  const handleToggleFavorite = async (feed: FeedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `${feed.title}\n${feed.summary || ''}`;
    const isCurrentlyFavorite = favorites.has(feed.id);
    
    // 如果是添加收藏，先设置 loading 状态
    if (!isCurrentlyFavorite) {
      setTagsLoadingIds(prev => new Set(prev).add(feed.id));
    }
    
    try {
      await toggleFavorite(feed.id, content, !isCurrentlyFavorite);
    } finally {
      // 移除 loading 状态
      setTagsLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(feed.id);
        return next;
      });
    }
  };

  // 处理重新生成标签
  const handleRegenerateTags = async (feed: FeedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `${feed.title}\n${feed.summary || ''}`;
    
    setRegeneratingIds(prev => new Set(prev).add(feed.id));
    try {
      await regenerateTags(feed.id, content);
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(feed.id);
        return next;
      });
    }
  };

  // 获取收藏信息
  const getFavoriteInfo = (feedId: string) => {
    return favorites.get(feedId);
  };

  // 渲染品牌图标
  const renderBrandIcon = (source: SourceType) => {
    const IconComponent = getBrandIcon(source);
    return <IconComponent className="w-3 h-3" />;
  };

  return (
    <>
      {/* 错误弹窗 */}
      {errorDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-xl w-[90%] max-w-md mx-4 overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-red-500/10">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  {errorDialog.errorType === 'API_NOT_CONFIGURED' ? t('feed.apiNotConfigured') : t('feed.summaryFailed')}
                </span>
              </div>
              <button
                onClick={handleCloseErrorDialog}
                className="p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="px-4 py-4">
              <p className="text-sm text-muted-foreground mb-3">
                {errorDialog.errorType === 'API_NOT_CONFIGURED' 
                  ? t('feed.configureApiFirst')
                  : t('feed.checkConfig')}
              </p>
              
              {errorDialog.errorType !== 'API_NOT_CONFIGURED' && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md mb-3">
                  <p className="text-xs text-red-500 break-all">{errorDialog.errorMessage}</p>
                </div>
              )}
              
              <div className="p-3 bg-wechat/5 border border-wechat/20 rounded-md">
                <p className="text-xs text-muted-foreground mb-2">{t('feed.configHints')}</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('feed.configHint1')}</li>
                  <li>{t('feed.configHint2')}</li>
                  <li>{t('feed.configHint3')}</li>
                </ul>
              </div>
            </div>
            
            {/* 弹窗按钮 */}
            <div className="flex gap-3 px-4 py-3 border-t border-border bg-secondary/30">
              <button
                onClick={handleCloseErrorDialog}
                className="flex-1 px-4 py-2 text-sm rounded-md border border-border hover:bg-secondary transition-colors"
              >
                {t('feed.laterMaybe')}
              </button>
              <button
                onClick={handleDialogOpenSettings}
                className="flex-1 px-4 py-2 text-sm rounded-md bg-wechat text-white hover:bg-wechat/90 transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {t('feed.goToSettings')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {feeds.map((feed) => {
          const isLoading = loadingIds.has(feed.id);
          const isRegenerating = regeneratingIds.has(feed.id);
          const isTagsLoading = tagsLoadingIds.has(feed.id);
          const favoriteInfo = getFavoriteInfo(feed.id);
          const isFavorite = favoriteInfo?.isFavorite || false;
          // 检查时间是否有效：不为空、不为 Invalid Date、不为 1970 年（Unix 纪元错误）
          const hasValidTime = (() => {
            if (!feed.publishedAt) return false;
            const date = new Date(feed.publishedAt);
            if (isNaN(date.getTime())) return false;
            // 1970 年通常表示解析错误，不显示
            if (date.getFullYear() === 1970) return false;
            return true;
          })();
          const errorInfo = errorIds.get(feed.id);
          
          return (
            <div
              key={feed.id}
              onClick={(e) => handleFeedClick(feed.url, e)}
              className={cn(
              'feed-item group relative cursor-pointer',
              'hover:shadow-lg hover:shadow-wechat/5',
              'transition-all duration-300',
              feed.isPinned && 'ring-1 ring-wechat/30 bg-wechat/5'
            )}
          >
            {/* Pinned indicator */}
            {feed.isPinned && (
              <div className="absolute top-2 right-8 text-wechat">
                <Pin className="w-3 h-3 fill-current" />
              </div>
            )}

            {/* Favorite Button */}
            <div className="absolute top-2 right-2">
              <FavoriteButton
                isFavorite={isFavorite}
                onToggle={(e) => handleToggleFavorite(feed, e)}
                size="sm"
                favoriteTitle={t('feed.favorite')}
                unfavoriteTitle={t('feed.unfavorite')}
              />
            </div>

            {/* Source Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex items-center justify-center w-5 h-5 rounded text-white', SOURCE_COLORS[feed.source] || 'bg-gray-500')}>
                {renderBrandIcon(feed.source)}
              </div>
              <span className="text-xs text-muted-foreground font-medium">{feed.sourceName || feed.source}</span>
              {feed.score !== undefined && feed.score > 0 && (
                <span className="text-xs text-wechat flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {formatNumber(feed.score)}
                </span>
              )}
              {feed.commentCount !== undefined && feed.commentCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {formatNumber(feed.commentCount)}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2 group-hover:text-wechat transition-colors pr-8">
              {feed.title}
            </h3>

            {/* AI Generated Tags (for favorited items) */}
            {isFavorite && favoriteInfo && (
              <div className="mb-3" data-no-navigate>
                {isTagsLoading || isRegenerating ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin text-wechat" />
                    <span>{t('feed.generatingTags')}</span>
                  </div>
                ) : (
                  <TagList
                    tags={favoriteInfo.tags}
                    category={favoriteInfo.category}
                    onRegenerate={(e: React.MouseEvent) => handleRegenerateTags(feed, e)}
                    isRegenerating={isRegenerating}
                    regenerateTitle={t('feed.regenerateTags')}
                  />
                )}
              </div>
            )}

            {/* Original Summary (from data source) */}
            {feed.summary && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {feed.summary}
              </p>
            )}

            {/* AI Summary Section */}
            {feed.aiSummary ? (
              <div data-no-navigate className="mb-3 p-2 bg-wechat/5 border border-wechat/20 rounded-lg relative">
                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                  <button
                    onClick={(e) => handleGenerateSummary(feed, e, true)}
                    disabled={isLoading}
                    className="p-0.5 rounded hover:bg-wechat/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('common.retry')}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 text-wechat/60 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-wechat/60 hover:text-wechat" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onFeedUpdate) {
                        onFeedUpdate({
                          ...feed,
                          aiSummary: undefined
                        });
                      }
                    }}
                    className="p-0.5 rounded hover:bg-wechat/20 transition-colors"
                    title={t('common.close')}
                  >
                    <X className="w-3 h-3 text-wechat/60 hover:text-wechat" />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-xs text-wechat mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('feed.aiSummary')}</span>
                </div>
                <p className="text-xs text-foreground pr-6">{feed.aiSummary}</p>
              </div>
            ) : errorInfo ? (
              // 错误提示
              <div data-no-navigate className="mb-3 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-red-500 mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>
                    {errorInfo.type === 'API_NOT_CONFIGURED' ? t('feed.apiNotConfigured') : t('feed.generateFailed')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 break-all">
                  {errorInfo.type === 'API_NOT_CONFIGURED' 
                    ? t('feed.configureApiFirst')
                    : errorInfo.message}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenSettings}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-md',
                      'bg-wechat/10 text-wechat hover:bg-wechat/20',
                      'transition-colors duration-200'
                    )}
                  >
                    <Settings className="w-3 h-3" />
                    <span>{t('feed.goToSettings')}</span>
                  </button>
                  <button
                    onClick={(e) => handleGenerateSummary(feed, e, true)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-md',
                      'bg-secondary hover:bg-wechat/10 text-muted-foreground hover:text-wechat',
                      'transition-colors duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{t('feed.retrying')}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>{t('common.retry')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => handleGenerateSummary(feed, e)}
                disabled={isLoading}
                className={cn(
                  'mb-3 flex items-center gap-1 text-xs px-2 py-1 rounded-md',
                  'bg-secondary hover:bg-wechat/10 text-muted-foreground hover:text-wechat',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t('feed.generating')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>{t('feed.generateSummary')}</span>
                  </>
                )}
              </button>
            )}

            {/* Original Tags (from data source) */}
            {!isFavorite && feed.tags && feed.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3" data-no-navigate>
                {feed.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 bg-secondary border border-border rounded text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
                {hasValidTime && (
                  <>
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="flex-shrink-0">{formatTime(feed.publishedAt)}</span>
                  </>
                )}
                {feed.author && <span className="truncate">{hasValidTime ? '· ' : ''}{feed.author}</span>}
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 border-2 border-wechat/0 group-hover:border-wechat/30 rounded-lg pointer-events-none transition-all duration-300" />
          </div>
        );
      })}
      </div>
    </>
  );
}

export default FeedList;
