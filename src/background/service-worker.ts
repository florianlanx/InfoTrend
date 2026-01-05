/*
 *   Copyright (c) 2025 InfoTrend Contributors
 *   All rights reserved.
 */
import { getConfig, getLastUpdate, saveFeeds, updateLastUpdate, saveConfig, updateDataMetadata, getFeeds } from '../services/storage.ts';
import { fetchAllData, setForceRefresh } from '../services/dataFetcher.ts';
import { generateSummary, APINotConfiguredError } from '../services/aiService.ts';
import { defaultSources } from '../types/index';
import { setupDailyRefreshAlarm, ALARM_NAMES } from './alarmScheduler.ts';
import { logger } from '../utils/logger.ts';

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await initializeData();
  await setupDailyRefreshAlarm();
});

// Check and setup alarm on browser startup
chrome.runtime.onStartup.addListener(async () => {
  await setupDailyRefreshAlarm();
});

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.DAILY_REFRESH) {
    setForceRefresh(true);
    await refreshData();
    setForceRefresh(false);
  }
});

// Open side panel on icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'REFRESH_DATA') {
    setForceRefresh(true);
    refreshData().then(() => {
      setForceRefresh(false);
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_DATA') {
    getLatestData().then((data: any) => sendResponse(data));
    return true;
  }

  // Generate single item summary
  if (message.type === 'GENERATE_SINGLE_SUMMARY') {
    generateSingleItemSummary(message.data.item)
      .then((summary) => sendResponse({ success: true, summary }))
      .catch((error) => {
        if (error instanceof APINotConfiguredError) {
          sendResponse({ 
            success: false, 
            error: error.message,
            errorType: 'API_NOT_CONFIGURED'
          });
        } else {
          sendResponse({ 
            success: false, 
            error: error.message || 'AI summary generation failed',
            errorType: 'GENERATION_FAILED'
          });
        }
      });
    return true;
  }
});

async function initializeData() {
  try {
    // Migration: Add new default sources if they don't exist
    const config = await getConfig();
    let changed = false;
    const existingIds = new Set(config.sources.map(s => s.id));

    for (const source of defaultSources) {
      if (!existingIds.has(source.id)) {
        config.sources.push(source);
        changed = true;
      }
    }

    if (changed) {
      await saveConfig(config);
    }

    await refreshData();
  } catch (error) {
    logger.error('Initialization error:', error);
  }
}

async function refreshData() {
  try {
    const config = await getConfig();
    const items = await fetchAllData(config.sources);

    const limitedItems = items.slice(0, config.maxItems);
    await saveFeeds(limitedItems);
    await updateLastUpdate();
    await updateDataMetadata();
  } catch (error) {
    logger.error('Refresh error:', error);
  }
}

async function getLatestData() {
  try {
    const config = await getConfig();
    const lastUpdate = await getLastUpdate();
    const feeds = await getFeeds();

    return {
      config,
      feeds,
      lastUpdate,
    };
  } catch (error) {
    logger.error('Get data error:', error);
    return {
      config: null,
      feeds: [],
      lastUpdate: 0,
    };
  }
}

// Generate single item summary
async function generateSingleItemSummary(item: any): Promise<string> {
  const summary = await generateSummary(item);
  return summary;
}
