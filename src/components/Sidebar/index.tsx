import { useEffect, useState, useMemo, useCallback } from 'react';
import { RefreshCw, Settings, Search, Filter, Sparkles, Sun, Moon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedList from './FeedList.tsx';
import { FeedItem, SourceType, SourceConfig } from '@/types/index.ts';
import { getFeeds, saveFeeds, getConfig } from '@/services/storage.ts';
import { safeOpenOptionsPage } from '@/utils/chrome.ts';
import { useTheme } from '@/hooks/useTheme.ts';
import { useI18n } from '@/i18n';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useSmartRefresh } from '@/hooks/useSmartRefresh';
import { useErrorHandler } from '@/hooks/useErrorHandler';

function Sidebar() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { toggleTheme, isDark } = useTheme();
  const { t } = useI18n();
  const { handleError } = useErrorHandler();
  
  // 收藏相关状态
  const favorites = useFavoriteStore((state) => state.favorites);
  const favoriteFilter = useFavoriteStore((state) => state.favoriteFilter);
  const tagFilter = useFavoriteStore((state) => state.tagFilter);
  const setFavoriteFilter = useFavoriteStore((state) => state.setFavoriteFilter);
  const setTagFilter = useFavoriteStore((state) => state.setTagFilter);

  // 智能刷新 Hook
  const { 
    showLoading: smartLoading,
    isSilentRefreshing,
    lastUpdateText,
    executeStrategy,
    manualRefresh,
  } = useSmartRefresh({
    onRefreshComplete: () => loadFeeds(),
    onSilentRefreshComplete: () => loadFeeds(),
  });

  // 加载数据的回调
  const loadFeeds = useCallback(async () => {
    const storedFeeds = await getFeeds();
    const config = await getConfig();
    
    // Build maps for pinned sources
    const pinnedByName = new Map<string, boolean>();
    const pinnedByUrl = new Map<string, boolean>();
    const pinnedByType = new Map<string, boolean>();
    
    config.sources.forEach((source: SourceConfig) => {
      if (source.isPinned) {
        pinnedByName.set(source.name, true);
        if (source.url) {
          pinnedByUrl.set(source.url, true);
        }
        if (source.type !== 'RSS') {
          pinnedByType.set(source.type, true);
        }
      }
    });
    
    // Sync isPinned status from config to feeds
    const syncedFeeds = storedFeeds.map(feed => {
      let isPinned = false;
      
      if (feed.source === 'RSS') {
        isPinned = pinnedByName.has(feed.sourceName || '');
        if (!isPinned && feed.id.startsWith('rss-')) {
          const urlMatch = feed.id.match(/^rss-(.+)-\d+$/);
          if (urlMatch) {
            isPinned = pinnedByUrl.has(urlMatch[1]);
          }
        }
      } else {
        isPinned = pinnedByType.has(feed.source);
      }
      
      return { ...feed, isPinned };
    });
    
    // Sort: pinned first, then by date
    const sortedFeeds = syncedFeeds.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt || 0);
      const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(b.publishedAt || 0);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
    
    setFeeds(sortedFeeds);
    setFilteredFeeds(sortedFeeds);
  }, []);

  // 初始化：执行智能刷新策略
  useEffect(() => {
    const init = async () => {
      // 先加载缓存数据
      await loadFeeds();
      // 执行智能刷新策略
      await executeStrategy();
    };
    init();
  }, []);

  useEffect(() => {
    filterFeeds();
  }, [feeds, searchQuery, activeFilter, favorites, favoriteFilter, tagFilter]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await manualRefresh();
      await loadFeeds();
    } catch (error) {
      handleError(error, { message: t('refresh.error') || '刷新失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedUpdate = async (updatedFeed: FeedItem) => {
    const newFeeds = feeds.map(f => 
      f.id === updatedFeed.id ? updatedFeed : f
    );
    setFeeds(newFeeds);
    await saveFeeds(newFeeds);
  };

  const filterFeeds = () => {
    let filtered = feeds;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        feed =>
          feed.title.toLowerCase().includes(query) ||
          (feed.summary && feed.summary.toLowerCase().includes(query)) ||
          (feed.aiSummary && feed.aiSummary.toLowerCase().includes(query)) ||
          (feed.tags && feed.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Apply source filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(feed => feed.source === activeFilter);
    }

    // Apply favorite filter
    if (favoriteFilter !== 'all') {
      const isFavoriteFilter = favoriteFilter === 'favorite';
      filtered = filtered.filter(feed => {
        const fav = favorites.get(feed.id);
        return isFavoriteFilter ? !!fav?.isFavorite : !fav?.isFavorite;
      });
    }

    // Apply tag filter
    if (tagFilter) {
      filtered = filtered.filter(feed => {
        const fav = favorites.get(feed.id);
        return fav?.tags.includes(tagFilter);
      });
    }

    // Maintain pinned-first sorting after filtering
    filtered = [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt || 0);
      const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(b.publishedAt || 0);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    setFilteredFeeds(filtered);
  };

  const openSettings = () => {
    safeOpenOptionsPage();
  };

  // 动态获取所有数据源的计数
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: feeds.length };
    feeds.forEach(feed => {
      counts[feed.source] = (counts[feed.source] || 0) + 1;
    });
    return counts;
  }, [feeds]);

  // 获取有数据的数据源列表
  const availableSources = useMemo(() => {
    const sources = new Set<SourceType>();
    feeds.forEach(feed => sources.add(feed.source));
    return Array.from(sources);
  }, [feeds]);

  return (
    <div className="h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wechat" />
            <h1 className="text-lg font-semibold text-foreground">{t('sidebar.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-wechat/10 hover:text-wechat"
              title={isDark ? t('sidebar.switchToLight') : t('sidebar.switchToDark')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="hover:bg-wechat/10 hover:text-wechat"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openSettings}
              className="hover:bg-wechat/10 hover:text-wechat"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('sidebar.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-wechat/50"
          />
        </div>

        {/* Favorite Filter */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={favoriteFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFavoriteFilter('all')}
            className={favoriteFilter === 'all' 
              ? 'bg-wechat text-white hover:bg-wechat/90' 
              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }
          >
            全部 ({feeds.length})
          </Button>
          <Button
            variant={favoriteFilter === 'favorite' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFavoriteFilter('favorite')}
            className={favoriteFilter === 'favorite'
              ? 'bg-wechat text-white hover:bg-wechat/90'
              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            收藏 ({Array.from(favorites.values()).length})
          </Button>
          {tagFilter && (
            <div className="flex items-center gap-1 px-2 py-1 bg-wechat/10 border border-wechat/30 rounded-full">
              <span className="text-xs text-wechat">标签: {tagFilter}</span>
              <button
                onClick={() => setTagFilter(null)}
                className="text-wechat hover:text-wechat/80"
              >
                <Filter className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs - 动态生成 */}
      <div className="px-4 py-3 border-b border-border bg-card/80 overflow-x-auto">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="bg-secondary border border-border flex-wrap h-auto gap-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat text-xs"
            >
              {t('sidebar.all')} ({sourceCounts.all})
            </TabsTrigger>
            {availableSources.map(source => (
              <TabsTrigger 
                key={source}
                value={source} 
                className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat text-xs"
              >
                {source} ({sourceCounts[source] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Feed List */}
      <ScrollArea className="flex-1 relative">
        {smartLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* WeChat Green Bouncing Dots Loader */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-wechat animate-bounce-dot" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-wechat/80 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-wechat/60 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
            </div>
            {/* Elegant text with fade animation */}
            <p className="text-sm font-light text-wechat/80 animate-pulse-text">
              {t('sidebar.loading')}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {filteredFeeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Filter className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">{t('sidebar.noFeeds')}</p>
              <p className="text-xs mt-2">{t('sidebar.noFeedsHint')}</p>
            </div>
          ) : (
              <FeedList feeds={filteredFeeds} onFeedUpdate={handleFeedUpdate} />
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-card/80 text-xs text-muted-foreground">
        {smartLoading || isSilentRefreshing ? (
          <p className="text-wechat">{t('refresh.fetching')}</p>
        ) : (
          <p>
            {t('sidebar.feedCount', { count: filteredFeeds.length })}
            {lastUpdateText && ` · ${lastUpdateText}`}
          </p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
