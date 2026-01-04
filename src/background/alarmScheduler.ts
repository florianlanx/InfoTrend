/*
 *   Copyright (c) 2025 InfoTrend Contributors
 *   All rights reserved.
 */

/**
 * Alarm Scheduler
 * Manages daily refresh tasks at 6 AM
 */

import { REFRESH_CONFIG } from '../services/freshnessService';

// Alarm name constants
export const ALARM_NAMES = {
  DAILY_REFRESH: 'infotrend-daily-refresh-6am',
};

/**
 * Calculate delay in minutes until the next target hour
 * @param targetHour - Target hour (24-hour format)
 * @returns Delay in minutes
 */
export function calculateDelayToNextTargetTime(targetHour: number): number {
  const now = new Date();
  const target = new Date();
  
  // Set target time to today's target hour
  target.setHours(targetHour, 0, 0, 0);
  
  // If target time has passed, set to tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  // Calculate delay (milliseconds to minutes)
  const delayMs = target.getTime() - now.getTime();
  return Math.ceil(delayMs / (60 * 1000));
}

/**
 * Set up daily refresh alarm
 */
export async function setupDailyRefreshAlarm(): Promise<void> {
  // Clear existing alarm first
  await chrome.alarms.clear(ALARM_NAMES.DAILY_REFRESH);
  
  // Calculate delay for first trigger
  const delayInMinutes = calculateDelayToNextTargetTime(REFRESH_CONFIG.DAILY_REFRESH_HOUR);
  
  // Create repeating alarm, triggers every 24 hours
  await chrome.alarms.create(ALARM_NAMES.DAILY_REFRESH, {
    delayInMinutes,
    periodInMinutes: 24 * 60, // 24 hours
  });
}

/**
 * Get alarm information
 */
export async function getDailyRefreshAlarmInfo(): Promise<chrome.alarms.Alarm | undefined> {
  return await chrome.alarms.get(ALARM_NAMES.DAILY_REFRESH);
}

/**
 * Check if alarm is set
 */
export async function isDailyRefreshAlarmSet(): Promise<boolean> {
  const alarm = await getDailyRefreshAlarmInfo();
  return !!alarm;
}

/**
 * Clear daily refresh alarm
 */
export async function clearDailyRefreshAlarm(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAMES.DAILY_REFRESH);
}

/**
 * Format next trigger time for display
 */
export function formatNextTriggerTime(alarm: chrome.alarms.Alarm | undefined): string {
  if (!alarm) return 'Not set';
  
  const nextTrigger = new Date(alarm.scheduledTime);
  return nextTrigger.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
