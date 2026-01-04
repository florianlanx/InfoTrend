/*
 *   Copyright (c) 2025 InfoTrend Contributors
 *   All rights reserved.
 */

/**
 * Unified logger utility for the extension
 * Logs are only shown in development mode to keep production clean
 */

const isDev = import.meta.env?.DEV ?? false;

export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[Debug]', ...args);
    }
  },

  /**
   * Info level logging - only in development
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[Info]', ...args);
    }
  },

  /**
   * Warning level logging - always shown
   */
  warn: (...args: unknown[]): void => {
    console.warn('[Warn]', ...args);
  },

  /**
   * Error level logging - always shown
   */
  error: (...args: unknown[]): void => {
    console.error('[Error]', ...args);
  },
};

export default logger;
