import React, { useEffect, useState } from 'react';
import { 
  Settings, Database, Download, Upload, Palette, Key, RefreshCw, Save, Trash2, 
  Sun, Moon, Plus, Edit2, GripVertical, X, Check, Globe, Pin 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  AppConfig, SourceConfig, defaultSources, 
  getSourceIcon, SourceCategory, FetchTimeRange 
} from '@/types/index.ts';
import { getConfig, saveConfig, exportData, importData, clearAll } from '@/services/storage.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { Toaster } from '@/components/ui/toaster';
import { useTheme } from '@/hooks/useTheme.ts';
import { cn } from '@/lib/utils.ts';
import { useI18n, LANGUAGE_OPTIONS, Locale } from '@/i18n';

interface EditingSource {
  id: string;
  source: SourceConfig;
}

function OptionsApp() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSource, setEditingSource] = useState<EditingSource | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState<Partial<SourceConfig>>({
    type: 'RSS',
    name: '',
    url: '',
    enabled: true,
    fetchCount: 50,
    fetchTimeRange: '7d',
    category: 'news',
  });
  const { toast } = useToast();
  const { isDark, toggleTheme, setTheme } = useTheme();
  const { t, locale, setLocale, actualLocale } = useI18n();

  const CATEGORY_OPTIONS: { value: SourceCategory; label: string }[] = [
    { value: 'ai', label: t('settings.category.ai') },
    { value: 'dev', label: t('settings.category.dev') },
    { value: 'news', label: t('settings.category.news') },
    { value: 'product', label: t('settings.category.product') },
    { value: 'research', label: t('settings.category.research') },
    { value: 'community', label: t('settings.category.community') },
  ];

  const TIME_RANGE_OPTIONS: { value: FetchTimeRange; label: string }[] = [
    { value: '1d', label: t('settings.sources.timeRange.1d') },
    { value: '3d', label: t('settings.sources.timeRange.3d') },
    { value: '7d', label: t('settings.sources.timeRange.7d') },
    { value: '30d', label: t('settings.sources.timeRange.30d') },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await getConfig();
      // 确保所有数据源都有 id
      const sourcesWithIds = loadedConfig.sources.map((source, index) => ({
        ...source,
        id: source.id || `source-${index}-${Date.now()}`,
        fetchCount: source.fetchCount || 10,
        category: source.category || 'news',
      }));
      setConfig({ ...loadedConfig, sources: sourcesWithIds });
    } catch (error) {
      console.error('Load config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await saveConfig(config);
      toast({
        title: t('settings.saveSuccess'),
        description: t('settings.saveSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('settings.saveFailed'),
        description: t('settings.saveFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSourceToggle = (id: string, enabled: boolean) => {
    if (!config) return;
    const newSources = config.sources.map(s => 
      s.id === id ? { ...s, enabled } : s
    );
    setConfig({ ...config, sources: newSources });
  };

  const handlePinSource = (id: string, pinned: boolean) => {
    if (!config) return;
    const newSources = config.sources.map(s => 
      s.id === id ? { ...s, isPinned: pinned } : s
    );
    setConfig({ ...config, sources: newSources });
  };

  const handleDeleteSource = (id: string) => {
    if (!config) return;
    if (!confirm(t('settings.sources.confirmDelete'))) return;
    
    const newSources = config.sources.filter((s) => s.id !== id);
    setConfig({ ...config, sources: newSources });
    toast({
      title: t('settings.sources.deleted'),
      description: t('settings.sources.deletedDesc'),
    });
  };

  const handleEditSource = (id: string) => {
    if (!config) return;
    const source = config.sources.find(s => s.id === id);
    if (source) {
      setEditingSource({
        id,
        source: { ...source },
      });
    }
  };

  const handleSaveEdit = () => {
    if (!config || !editingSource) return;
    
    const newSources = config.sources.map(s => 
      s.id === editingSource.id ? editingSource.source : s
    );
    setConfig({ ...config, sources: newSources });
    setEditingSource(null);
    toast({
      title: t('settings.sources.updated'),
      description: t('settings.sources.updatedDesc'),
    });
  };

  const handleUpdateSource = (id: string, updates: Partial<SourceConfig>) => {
    if (!config) return;
    const newSources = config.sources.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    setConfig({ ...config, sources: newSources });
  };

  const handleAddSource = () => {
    if (!config || !newSource.name || !newSource.url) return;
    
    const source: SourceConfig = {
      id: `custom-${Date.now()}`,
      type: 'RSS',
      name: newSource.name,
      url: newSource.url,
      enabled: true,
      fetchCount: 50,
      fetchTimeRange: newSource.fetchTimeRange as FetchTimeRange || '7d',
      category: newSource.category as SourceCategory || 'news',
      icon: getSourceIcon('RSS'),
    };
    
    setConfig({ ...config, sources: [...config.sources, source] });
    setNewSource({
      type: 'RSS',
      name: '',
      url: '',
      enabled: true,
      fetchCount: 50,
      fetchTimeRange: '7d',
      category: 'news',
    });
    setShowAddForm(false);
    toast({
      title: t('settings.sources.added'),
      description: t('settings.sources.addedDesc'),
    });
  };

  const handleResetToDefault = () => {
    if (!confirm(t('settings.sources.confirmReset'))) return;
    
    if (config) {
      setConfig({ ...config, sources: [...defaultSources] });
      toast({
        title: t('settings.sources.restored'),
        description: t('settings.sources.restoredDesc'),
      });
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportData(format);
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infotrend-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t('settings.data.exportSuccess'),
        description: t('settings.data.exportSuccessDesc', { format: format.toUpperCase() }),
      });
    } catch (error) {
      toast({
        title: t('settings.data.exportFailed'),
        description: t('settings.data.exportFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const format = file.name.endsWith('.csv') ? 'csv' : 'json';
        const success = await importData(content, format);
        if (success) {
          toast({
            title: t('settings.data.importSuccess'),
            description: t('settings.data.importSuccessDesc'),
          });
          await loadConfig();
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast({
          title: t('settings.data.importFailed'),
          description: t('settings.data.importFailedDesc'),
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (!confirm(t('settings.data.confirmClear'))) return;

    try {
      await clearAll();
      toast({
        title: t('settings.data.clearSuccess'),
        description: t('settings.data.clearSuccessDesc'),
      });
      await loadConfig();
    } catch (error) {
      toast({
        title: t('settings.data.clearFailed'),
        description: t('settings.data.clearFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-wechat animate-spin" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Toaster />
      
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-wechat" />
            <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-wechat/10 hover:text-wechat"
              title={isDark ? t('sidebar.switchToLight') : t('sidebar.switchToDark')}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-wechat hover:bg-wechat/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? t('common.saving') : t('settings.saveSettings')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="bg-secondary border border-border w-full justify-start mb-6">
            <TabsTrigger value="sources" className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat">
              <Database className="w-4 h-4 mr-2" />
              {t('settings.tab.sources')}
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat">
              <Key className="w-4 h-4 mr-2" />
              {t('settings.tab.api')}
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat">
              <Download className="w-4 h-4 mr-2" />
              {t('settings.tab.data')}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-wechat/20 data-[state=active]:text-wechat">
              <Palette className="w-4 h-4 mr-2" />
              {t('settings.tab.appearance')}
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('settings.sources.title')}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefault}
                    className="border-border hover:border-wechat/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('settings.sources.resetDefault')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="bg-wechat hover:bg-wechat/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('settings.sources.addSource')}
                  </Button>
                </div>
              </div>

              {/* Add Source Form */}
              {showAddForm && (
                <div className="mb-6 p-4 rounded-lg bg-wechat/5 border border-wechat/20">
                  <h3 className="font-medium mb-4">{t('settings.sources.addNew')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground mb-1 block">{t('settings.sources.name')}</label>
                      <Input
                        value={newSource.name || ''}
                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                        placeholder={t('settings.sources.namePlaceholder')}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground mb-1 block">{t('settings.sources.rssUrl')}</label>
                      <Input
                        value={newSource.url || ''}
                        onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                        placeholder="https://example.com/feed.xml"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">{t('settings.sources.category')}</label>
                      <select
                        value={newSource.category}
                        onChange={(e) => setNewSource({ ...newSource, category: e.target.value as SourceCategory })}
                        className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2"
                      >
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">{t('settings.sources.timeRange')}</label>
                      <select
                        value={newSource.fetchTimeRange || '7d'}
                        onChange={(e) => setNewSource({ ...newSource, fetchTimeRange: e.target.value as FetchTimeRange })}
                        className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2"
                      >
                        {TIME_RANGE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleAddSource} className="bg-wechat hover:bg-wechat/90">
                      {t('common.add')}
                    </Button>
                  </div>
                </div>
              )}

              {/* RSS Feeds Section */}
              <div className="mb-6">
                 <h3 className="font-medium mb-3 text-wechat flex items-center gap-2">
                    <span className="text-lg">📡</span> {t('settings.sources.rss')}
                 </h3>
                 <div className="space-y-3">
                    {config.sources.filter(s => s.type === 'RSS').length === 0 ? (
                        <div className="text-sm text-muted-foreground p-8 text-center border border-dashed border-border rounded-lg bg-secondary/10">
                            {t('settings.sources.noRss')}
                        </div>
                    ) : (
                        config.sources
                        .filter(s => s.type === 'RSS')
                        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                        .map((source) => (
                          <div
                            key={source.id}
                            className={cn(
                              'flex items-center gap-4 p-4 rounded-lg border transition-all duration-300',
                              source.enabled 
                                ? 'bg-secondary/50 border-border' 
                                : 'bg-secondary/20 border-border/50 opacity-60',
                              source.isPinned && 'border-wechat/50 bg-wechat/5 shadow-sm'
                            )}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <div className="text-2xl relative">
                                {source.icon || getSourceIcon(source.type)}
                                {source.isPinned && (
                                    <div className="absolute -top-1 -right-1 bg-wechat rounded-full p-0.5 border border-background">
                                        <Pin className="w-2 h-2 text-white fill-current" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {editingSource?.id === source.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingSource.source.name}
                                    onChange={(e) => setEditingSource({
                                      ...editingSource,
                                      source: { ...editingSource.source, name: e.target.value }
                                    })}
                                    className="h-8"
                                  />
                                  <div className="flex gap-2">
                                      <Input
                                          value={editingSource.source.url}
                                          onChange={(e) => setEditingSource({
                                              ...editingSource,
                                              source: { ...editingSource.source, url: e.target.value }
                                          })}
                                          className="h-8 flex-1"
                                          placeholder="RSS URL"
                                      />
                                      <select
                                        value={editingSource.source.fetchTimeRange || '7d'}
                                        onChange={(e) => setEditingSource({
                                          ...editingSource,
                                          source: { ...editingSource.source, fetchTimeRange: e.target.value as FetchTimeRange }
                                        })}
                                        className="h-8 bg-secondary border border-border text-foreground rounded-md px-2 text-sm"
                                      >
                                        {TIME_RANGE_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground truncate">{source.name}</h3>
                                      {source.isPinned && <span className="text-[10px] bg-wechat/10 text-wechat px-1.5 py-0.5 rounded-full font-medium">{t('settings.sources.pin')}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="truncate max-w-[200px]">{source.url}</span>
                                    <span>·</span>
                                    <span>{t(`settings.sources.timeRange.${source.fetchTimeRange || '7d'}`)}</span>
                                    {source.category && (
                                      <>
                                        <span>·</span>
                                        <span>{t(`settings.category.${source.category}`)}</span>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {editingSource?.id === source.id ? (
                                <>
                                  <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-8 w-8 text-wechat hover:bg-wechat/10"><Check className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => setEditingSource(null)} className="h-8 w-8 hover:bg-secondary"><X className="w-4 h-4" /></Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handlePinSource(source.id, !source.isPinned)} 
                                    className={cn("h-8 w-8", source.isPinned ? "text-wechat bg-wechat/10" : "text-muted-foreground hover:bg-secondary")}
                                    title={t('settings.sources.pin')}
                                  >
                                    <Pin className={cn("w-4 h-4", source.isPinned && "fill-current")} />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditSource(source.id)} className="h-8 w-8 hover:bg-secondary"><Edit2 className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSource(source.id)} className="h-8 w-8 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                                </>
                              )}
                              <Switch checked={source.enabled} onCheckedChange={(checked) => handleSourceToggle(source.id, checked)} />
                            </div>
                          </div>
                        ))
                    )}
                 </div>
              </div>

              <Separator className="my-6" />

              {/* Built-in Sources Section */}
              <div className="mb-6">
                 <h3 className="font-medium mb-3 text-wechat flex items-center gap-2">
                    <span className="text-lg">💎</span> {t('settings.sources.builtin')}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.sources.filter(s => s.type !== 'RSS').map((source) => (
                      <div
                        key={source.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          source.enabled 
                            ? 'bg-secondary/50 border-border' 
                            : 'bg-secondary/20 border-border/50 opacity-60'
                        )}
                      >
                        <div className="text-xl">{source.icon || getSourceIcon(source.type)}</div>
                        
                        <div className="flex-1 min-w-0">
                           <h3 className="font-medium text-foreground truncate text-sm">{source.name}</h3>
                           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <select 
                                    className="bg-transparent border border-border rounded px-1 h-5 text-[10px]"
                                    value={source.fetchCount}
                                    onChange={(e) => handleUpdateSource(source.id, { fetchCount: parseInt(e.target.value) })}
                                >
                                    {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span>{t('settings.sources.items')}</span>
                                {source.minScore !== undefined && (
                                  <>
                                    <span>·</span>
                                    <span>{t('settings.sources.minScore')}</span>
                                    <input 
                                      type="number" 
                                      className="bg-transparent border border-border rounded px-1 h-5 w-14 text-[10px]"
                                      value={source.minScore}
                                      onChange={(e) => handleUpdateSource(source.id, { minScore: parseInt(e.target.value) || 0 })}
                                    />
                                  </>
                                )}
                           </div>
                           <p className="text-[10px] text-muted-foreground truncate">{t(`source.desc.${source.id}`) !== `source.desc.${source.id}` ? t(`source.desc.${source.id}`) : ''}</p>
                        </div>
                        
                        <Switch checked={source.enabled} onCheckedChange={(checked) => handleSourceToggle(source.id, checked)} />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-8">
                <h3 className="font-medium mb-2">{t('settings.sources.maxItems')}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('settings.sources.maxItemsDesc')}
                </p>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={config.maxItems}
                  onChange={(e) =>
                    setConfig({ ...config, maxItems: parseInt(e.target.value) || 100 })
                  }
                  className="max-w-xs"
                />
              </div>
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('settings.api.title')}</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">{t('settings.api.baseUrl')}</h3>
                  <Input
                    type="text"
                    placeholder={t('settings.api.baseUrlPlaceholder')}
                    value={config.apiBaseUrl || ''}
                    onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
                    className="max-w-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.api.baseUrlDesc')}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">{t('settings.api.apiKey')}</h3>
                  <Input
                    type="password"
                    placeholder={t('settings.api.apiKeyPlaceholder')}
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="max-w-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.api.apiKeyDesc')}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">{t('settings.api.model')}</h3>
                  <Input
                    type="text"
                    placeholder={t('settings.api.modelPlaceholder')}
                    value={config.apiModel || ''}
                    onChange={(e) => setConfig({ ...config, apiModel: e.target.value })}
                    className="max-w-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.api.modelDesc')}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-wechat/5 border border-wechat/20">
                  <h4 className="font-medium text-wechat mb-2">💡 {t('settings.api.examples')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex flex-col gap-1">
                      <span className="font-medium">Google Gemini:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">Base URL: https://generativelanguage.googleapis.com/v1beta/openai | Model: gemini-2.0-flash</code>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="font-medium">OpenAI:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">Base URL: https://api.openai.com/v1 | Model: gpt-4o-mini</code>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="font-medium">DeepSeek:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">Base URL: https://api.deepseek.com/v1 | Model: deepseek-chat</code>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="font-medium">Groq:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">Base URL: https://api.groq.com/openai/v1 | Model: llama-3.1-70b-versatile</code>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="font-medium">本地 Ollama:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">Base URL: http://localhost:11434/v1 | Model: llama3</code>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-medium mb-2">📝 {t('settings.api.usage')}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {t('settings.api.usageHint1')}</li>
                    <li>• {t('settings.api.usageHint2')}</li>
                    <li>• {t('settings.api.usageHint3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('settings.data.title')}</h2>
              <div className="space-y-6">
                {/* Export */}
                <div>
                  <h3 className="font-medium mb-3">{t('settings.data.export')}</h3>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleExport('json')}
                      variant="outline"
                      className="border-border hover:border-wechat/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('settings.data.exportJson')}
                    </Button>
                    <Button
                      onClick={() => handleExport('csv')}
                      variant="outline"
                      className="border-border hover:border-wechat/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('settings.data.exportCsv')}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Import */}
                <div>
                  <h3 className="font-medium mb-3">{t('settings.data.import')}</h3>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="border-border hover:border-wechat/50"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {t('settings.data.importData')}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.data.importFormats')}
                  </p>
                </div>

                <Separator />

                {/* Clear Data */}
                <div>
                  <h3 className="font-medium mb-3 text-red-400">{t('settings.data.danger')}</h3>
                  <Button
                    onClick={handleClearData}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.data.clearAll')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.data.clearAllDesc')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('settings.appearance.title')}</h2>
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="w-5 h-5 text-wechat" /> : <Sun className="w-5 h-5 text-wechat" />}
                    <div>
                      <h3 className="font-medium">{t('settings.appearance.darkMode')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isDark ? t('settings.appearance.currentDark') : t('settings.appearance.currentLight')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>

                {/* Language Setting */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-wechat" />
                    <div>
                      <h3 className="font-medium">{t('settings.appearance.language')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.appearance.languageDesc')}
                      </p>
                    </div>
                  </div>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm min-w-[140px]"
                  >
                    {LANGUAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {actualLocale === 'zh-CN' ? opt.nativeLabel : opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default OptionsApp;
