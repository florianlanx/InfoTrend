/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */

/**
 * 数据新鲜度服务
 * 负责评估缓存数据的新鲜程度，决定刷新策略
 */

// 刷新策略枚举
export enum RefreshStrategy {
  IMMEDIATE_DISPLAY = 'immediate',  // 直接显示，数据足够新鲜
  SILENT_REFRESH = 'silent',        // 静默刷新，先显示旧数据再更新
  FORCE_REFRESH = 'force'           // 强制刷新，显示加载状态
}

// 刷新配置
export const REFRESH_CONFIG = {
  // 静默刷新阈值：30 分钟
  SILENT_THRESHOLD_MS: 30 * 60 * 1000,
  // 强制刷新阈值：6 小时
  FORCE_THRESHOLD_MS: 6 * 60 * 60 * 1000,
  // 每日刷新时间：早上 6 点
  DAILY_REFRESH_HOUR: 6,
};

// 数据元信息接口
export interface DataMetadata {
  lastUpdateTime: number;      // 最后更新时间戳 (Unix timestamp)
  lastUpdateDate: string;      // 最后更新日期 YYYY-MM-DD
}

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 检查是否是同一天
 */
export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}

/**
 * 检查是否跨天
 */
export function isNewDay(lastUpdateDate: string): boolean {
  const today = getTodayDateString();
  return !isSameDay(lastUpdateDate, today);
}

/**
 * 计算数据年龄（毫秒）
 */
export function calculateDataAge(lastUpdateTime: number): number {
  return Date.now() - lastUpdateTime;
}

/**
 * 根据元数据获取刷新策略
 * @param metadata 数据元信息
 * @returns 刷新策略
 */
export function getRefreshStrategy(metadata: DataMetadata | null): RefreshStrategy {
  // 如果没有元数据，强制刷新
  if (!metadata || !metadata.lastUpdateTime) {
    return RefreshStrategy.FORCE_REFRESH;
  }

  const { lastUpdateTime, lastUpdateDate } = metadata;
  const age = calculateDataAge(lastUpdateTime);

  // 检查是否跨天 - 跨天必须强制刷新
  if (isNewDay(lastUpdateDate)) {
    return RefreshStrategy.FORCE_REFRESH;
  }

  // 检查数据年龄
  if (age > REFRESH_CONFIG.FORCE_THRESHOLD_MS) {
    // 超过 6 小时，强制刷新
    return RefreshStrategy.FORCE_REFRESH;
  }

  if (age > REFRESH_CONFIG.SILENT_THRESHOLD_MS) {
    // 30 分钟 ~ 6 小时，静默刷新
    return RefreshStrategy.SILENT_REFRESH;
  }

  // 小于 30 分钟，直接显示
  return RefreshStrategy.IMMEDIATE_DISPLAY;
}

/**
 * 格式化最后更新时间
 * @param timestamp 时间戳
 * @param t 翻译函数（可选，不传则返回空字符串）
 */
export function formatLastUpdateTime(timestamp: number, t?: (key: string, params?: Record<string, unknown>) => string): string {
  if (!t) return '';
  if (!timestamp) return t('refresh.neverUpdated');

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (minutes < 1) return t('refresh.justUpdated');
  if (minutes < 60) return t('refresh.minutesAgo', { minutes });
  if (hours < 24) return t('refresh.hoursAgo', { hours });
  return t('refresh.daysAgo', { days });
}
