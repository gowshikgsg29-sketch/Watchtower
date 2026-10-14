import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { AddWebsiteModal } from './components/AddWebsiteModal';
import { CommandPalette } from './components/CommandPalette';
import { Toast, ToastMessage } from './components/Toast';

import { Dashboard } from './pages/Dashboard';
import { MonitoredWebsites } from './pages/MonitoredWebsites';
import { WebsiteDetails } from './pages/WebsiteDetails';
import { VisualDiffInspector } from './pages/VisualDiffInspector';
import { ChangeHistory } from './pages/ChangeHistory';
import { Settings } from './pages/Settings';

import { apiService } from './services/apiService';
import {
  MonitoredWebsite,
  WebsiteSnapshot,
  ChangeRecord,
  NotificationSettings,
  SystemStats,
} from './types/monitor';
import { INITIAL_STATS, INITIAL_SETTINGS } from './services/sampleData';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  // Data States
  const [websites, setWebsites] = useState<MonitoredWebsite[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, WebsiteSnapshot[]>>({});
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(INITIAL_SETTINGS);
  const [stats, setStats] = useState<SystemStats>(INITIAL_STATS);

  // Diff inspection specific params
  const [diffParams, setDiffParams] = useState<{
    websiteId?: string;
    oldSnapId?: string;
    newSnapId?: string;
  }>({});

  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper for adding toast notifications
  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Bootstrap data on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [wList, cList, setts, st] = await Promise.all([
          apiService.getWebsites(),
          apiService.getChangeHistory(),
          apiService.getSettings(),
          apiService.getStats(),
        ]);

        setWebsites(wList);
        setChanges(cList);
        setSettings(setts);
        setStats(st);

        // Fetch snapshots for top websites
        const snapMap: Record<string, WebsiteSnapshot[]> = {};
        for (const w of wList) {
          snapMap[w.id] = await apiService.getSnapshots(w.id);
        }
        setSnapshots(snapMap);
      } catch (err) {
        console.error('Failed to bootstrap Watchtower data:', err);
        addToast('error', 'Telemetry Bootstrap Error', 'Failed to load initial monitor targets.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();

    // Periodic synchronization to reflect background scheduler changes
    const interval = setInterval(async () => {
      try {
        const [wList, cList, st] = await Promise.all([
          apiService.getWebsites(),
          apiService.getChangeHistory(),
          apiService.getStats(),
        ]);
        setWebsites(wList);
        setChanges(cList);
        setStats(st);
      } catch (err) {
        // Silently skip if backend is restarting
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddWebsite = async (data: {
    name: string;
    url: string;
    checkInterval: string;
    selectorMode: 'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown';
    cssSelector?: string;
    alertChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  }) => {
    const newSite = await apiService.addWebsite(data);
    setWebsites(await apiService.getWebsites());
    setStats(await apiService.getStats());

    // Update snapshots map
    const newSnaps = await apiService.getSnapshots(newSite.id);
    setSnapshots((prev) => ({ ...prev, [newSite.id]: newSnaps }));

    addToast(
      'success',
      'Target Enrolled in Cluster',
      `Actively monitoring ${newSite.name} at interval ${newSite.checkInterval}.`
    );
  };

  const handleQuickAdd = async (data: {
    name: string;
    url: string;
    checkInterval: string;
    selectorMode: 'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown';
    alertChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  }) => {
    await handleAddWebsite(data);
  };

  const handleTogglePause = async (id: string) => {
    const updated = await apiService.togglePauseWebsite(id);
    if (updated) {
      setWebsites(await apiService.getWebsites());
      setStats(await apiService.getStats());
      addToast(
        'info',
        updated.status === 'paused' ? 'Target Paused' : 'Monitoring Resumed',
        `Telemetry for ${updated.name} is now ${updated.status}.`
      );
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    const target = websites.find((w) => w.id === id);
    const success = await apiService.deleteWebsite(id);
    if (success) {
      setWebsites(await apiService.getWebsites());
      setStats(await apiService.getStats());
      setSnapshots((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setChanges(await apiService.getChangeHistory());

      if (selectedWebsiteId === id) {
        setSelectedWebsiteId(null);
        setCurrentPage('websites');
      }
      addToast(
        'info',
        'Target Decommissioned',
        `Removed ${target?.name || 'target'} from active cluster monitoring.`
      );
    }
  };

  const handleTriggerCheck = async (id: string) => {
    try {
      const result = await apiService.triggerManualCheck(id);
      setWebsites(await apiService.getWebsites());
      setStats(await apiService.getStats());

      // Refresh snapshots for this target and recent changes
      const updatedSnaps = await apiService.getSnapshots(id);
      setSnapshots((prev) => ({ ...prev, [id]: updatedSnaps }));
      setChanges(await apiService.getChangeHistory());

      addToast(
        'success',
        'Synchronous Ping Complete',
        `${result.site.name} responded with HTTP ${result.site.httpStatus} in ${result.latencyMs}ms.`
      );
    } catch (err: any) {
      addToast('error', 'Ping Failed', err?.message || 'Host connection error.');
    }
  };

  const handleUpdateInterval = async (id: string, newInterval: string) => {
    try {
      const updated = await apiService.updateWebsite(id, { checkInterval: newInterval });
      setWebsites(await apiService.getWebsites());
      addToast(
        'success',
        'Monitoring Interval Updated',
        `${updated.name} schedule updated to ${newInterval}.`
      );
    } catch (err: any) {
      addToast('error', 'Interval Update Failed', err?.message || 'Could not update interval.');
    }
  };

  const handleTriggerGlobalPing = () => {
    addToast(
      'success',
      'Manual Cluster Audit Initiated',
      `Synchronous ping dispatched to ${websites.length} hosts. All node heartbeats nominal.`
    );
  };

  const handleSaveSettings = async (newSettings: NotificationSettings) => {
    const saved = await apiService.saveSettings(newSettings);
    setSettings(saved);
    addToast('success', 'Settings Saved', 'Telemetry parameters and alert channels updated.');
  };

  const handleTestNotification = async (channel: 'telegram' | 'slack' | 'discord' | 'email') => {
    const result = await apiService.testNotification(channel);
    addToast('success', 'Test Alert Dispatched', result.message);
  };

  const handleSelectWebsite = (id: string) => {
    setSelectedWebsiteId(id);
    setCurrentPage('details');
  };

  const handleSelectForDiff = (websiteId: string, oldSnapId?: string, newSnapId?: string) => {
    setDiffParams({ websiteId, oldSnapId, newSnapId });
    setCurrentPage('diff');
  };

  const activeWebsite = websites.find((w) => w.id === selectedWebsiteId) || websites[0];

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          if (page !== 'details') {
            setSelectedWebsiteId(null);
          }
        }}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        activeCount={websites.filter((w) => w.status === 'healthy').length}
        totalCount={30}
      />

      {/* 2. MAIN APPLICATION SHELL */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          pageTitle={activeWebsite?.name}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          hostsCount={websites.length}
          avgPingMs={stats.avgPingMs}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-gutter-md lg:p-gutter-lg max-w-[1720px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-body-sm text-outline font-mono">
                Bootstrapping Watchtower Telemetry Matrix...
              </span>
            </div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  websites={websites}
                  changes={changes}
                  onNavigate={(page) => setCurrentPage(page)}
                  onSelectWebsite={handleSelectWebsite}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onTriggerCheck={handleTriggerCheck}
                  onQuickAdd={handleQuickAdd}
                  onTriggerGlobalPing={handleTriggerGlobalPing}
                />
              )}

              {currentPage === 'websites' && (
                <MonitoredWebsites
                  websites={websites}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onSelectWebsite={handleSelectWebsite}
                  onTogglePause={handleTogglePause}
                  onDeleteWebsite={handleDeleteWebsite}
                  onTriggerCheck={handleTriggerCheck}
                />
              )}

              {currentPage === 'details' && activeWebsite && (
                <WebsiteDetails
                  website={activeWebsite}
                  snapshots={snapshots[activeWebsite.id] || []}
                  onBack={() => setCurrentPage('websites')}
                  onNavigate={(page) => setCurrentPage(page)}
                  onTriggerCheck={handleTriggerCheck}
                  onTogglePause={handleTogglePause}
                  onSelectForDiff={handleSelectForDiff}
                  onUpdateInterval={handleUpdateInterval}
                />
              )}

              {currentPage === 'diff' && (
                <VisualDiffInspector
                  websites={websites}
                  snapshots={snapshots}
                  initialWebsiteId={diffParams.websiteId}
                  initialOldSnapshotId={diffParams.oldSnapId}
                  initialNewSnapshotId={diffParams.newSnapId}
                />
              )}

              {currentPage === 'history' && (
                <ChangeHistory
                  changes={changes}
                  websites={websites}
                  onOpenDiff={handleSelectForDiff}
                />
              )}

              {currentPage === 'settings' && (
                <Settings
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onTestNotification={handleTestNotification}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. MODALS & OVERLAYS */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddWebsite}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        websites={websites}
        onSelectWebsite={handleSelectWebsite}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
