/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */

/**
 * 智能刷新 Hook
 * 根据数据新鲜度自动决定刷新策略
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDataMetadata, DataMetadata } from '@/services/storage';
import { 
  RefreshStrategy, 
  getRefreshStrategy, 
  formatLastUpdateTime,
} from '@/services/freshnessService';
import { safeRuntimeSendMessage } from '@/utils/chrome';
import { useTranslation } from '@/i18n';
import { logger } from '@/utils/logger';

export interface SmartRefreshState {
  // 当前刷新策略
  strategy: RefreshStrategy;
  // 是否正在刷新
  isRefreshing: boolean;
  // 是否正在静默刷新
  isSilentRefreshing: boolean;
  // 是否需要显示加载状态（强制刷新时）
  showLoading: boolean;
  // 最后更新时间的格式化文本
  lastUpdateText: string;
  // 数据元信息
  metadata: DataMetadata | null;
}

export interface UseSmartRefreshOptions {
  // 刷新完成后的回调
  onRefreshComplete?: () => void;
  // 静默刷新完成后的回调
  onSilentRefreshComplete?: () => void;
}

export function useSmartRefresh(options: UseSmartRefreshOptions = {}) {
  const { onRefreshComplete, onSilentRefreshComplete } = options;
  const { t } = useTranslation();
  
  const [state, setState] = useState<SmartRefreshState>({
    strategy: RefreshStrategy.IMMEDIATE_DISPLAY,
    isRefreshing: false,
    isSilentRefreshing: false,
    showLoading: false,
    lastUpdateText: '',
    metadata: null,
  });

  // 用于防止重复刷新
  const isRefreshingRef = useRef(false);

  /**
   * 检查数据新鲜度并决定策略
   */
  const checkFreshness = useCallback(async (): Promise<RefreshStrategy> => {
    const metadata = await getDataMetadata();
    const strategy = getRefreshStrategy(metadata);
    
    setState(prev => ({
      ...prev,
      strategy,
      metadata,
      lastUpdateText: metadata ? formatLastUpdateTime(metadata.lastUpdateTime, t) : t('refresh.neverUpdated'),
    }));
    
    return strategy;
  }, [t]);

  /**
   * 执行刷新操作
   */
  const doRefresh = useCallback(async (): Promise<boolean> => {
    try {
      await safeRuntimeSendMessage({ type: 'REFRESH_DATA' });
      // 等待数据刷新完成
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      logger.error('[SmartRefresh] Refresh failed:', error);
      return false;
    }
  }, []);

  /**
   * 根据策略执行刷新
   * @returns 是否需要等待加载（强制刷新时返回 true）
   */
  const executeStrategy = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    const strategy = await checkFreshness();
    
    switch (strategy) {
      case RefreshStrategy.IMMEDIATE_DISPLAY:
        // 数据足够新鲜，不需要刷新
        return false;
        
      case RefreshStrategy.SILENT_REFRESH:
        // 静默刷新：先显示旧数据，后台更新
        isRefreshingRef.current = true;
        setState(prev => ({ ...prev, isSilentRefreshing: true }));
        
        doRefresh().then((success) => {
          isRefreshingRef.current = false;
          setState(prev => ({ 
            ...prev, 
            isSilentRefreshing: false,
            lastUpdateText: t('refresh.justUpdated'),
          }));
          if (success) {
            onSilentRefreshComplete?.();
          }
        });
        
        return false; // 不需要等待，先显示旧数据
        
      case RefreshStrategy.FORCE_REFRESH:
        // 强制刷新：显示加载状态
        isRefreshingRef.current = true;
        setState(prev => ({ 
          ...prev, 
          isRefreshing: true, 
          showLoading: true,
        }));
        
        const success = await doRefresh();
        
        isRefreshingRef.current = false;
        setState(prev => ({ 
          ...prev, 
          isRefreshing: false, 
          showLoading: false,
          lastUpdateText: t('refresh.justUpdated'),
        }));
        
        if (success) {
          onRefreshComplete?.();
        }
        
        return true; // 需要等待加载完成
        
      default:
        return false;
    }
  }, [checkFreshness, doRefresh, onRefreshComplete, onSilentRefreshComplete, t]);

  /**
   * 手动触发刷新（用户点击刷新按钮）
   */
  const manualRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setState(prev => ({ 
      ...prev, 
      isRefreshing: true,
    }));
    
    const success = await doRefresh();
    
    isRefreshingRef.current = false;
    setState(prev => ({ 
      ...prev, 
      isRefreshing: false,
      lastUpdateText: t('refresh.justUpdated'),
    }));
    
    if (success) {
      onRefreshComplete?.();
    }
  }, [doRefresh, onRefreshComplete, t]);

  /**
   * 更新最后更新时间显示
   */
  const updateLastUpdateText = useCallback(async () => {
    const metadata = await getDataMetadata();
    if (metadata) {
      setState(prev => ({
        ...prev,
        metadata,
        lastUpdateText: formatLastUpdateTime(metadata.lastUpdateTime, t),
      }));
    }
  }, [t]);

  // 定期更新最后更新时间显示（每分钟）
  useEffect(() => {
    updateLastUpdateText();
    const interval = setInterval(updateLastUpdateText, 60 * 1000);
    return () => clearInterval(interval);
  }, [updateLastUpdateText]);

  return {
    ...state,
    executeStrategy,
    manualRefresh,
    checkFreshness,
    updateLastUpdateText,
  };
}
