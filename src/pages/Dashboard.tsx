import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  FileDiff,
  Settings as SettingsIcon,
  Plus,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { MonitoredWebsite, SystemStats, ChangeRecord } from '../types/monitor';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  stats: SystemStats;
  websites: MonitoredWebsite[];
  changes: ChangeRecord[];
  onNavigate: (page: PageId) => void;
  onSelectWebsite: (siteId: string) => void;
  onOpenAddModal: () => void;
  onTriggerCheck: (siteId: string) => Promise<void>;
  onQuickAdd: (data: {
    name: string;
    url: string;
    checkInterval: string;
    selectorMode: 'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown';
    alertChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  }) => Promise<void>;
  onTriggerGlobalPing: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  websites,
  changes,
  onNavigate,
  onSelectWebsite,
  onOpenAddModal,
  onTriggerCheck,
  onQuickAdd,
  onTriggerGlobalPing,
}) => {
  // Filter state for targets table
  const [targetFilter, setTargetFilter] = useState<'all' | 'active' | 'alerts' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIds, setCheckingIds] = useState<Record<string, boolean>>({});

  // Quick banner form states
  const [quickName, setQuickName] = useState('ACM Portal & Events');
  const [quickUrl, setQuickUrl] = useState('https://acm.club.edu/events');
  const [quickInterval, setQuickInterval] = useState('Every 5 minutes');
  const [quickSelectorMode, setQuickSelectorMode] = useState<
    'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown'
  >('CSS Selector #content');
  const [quickChannels, setQuickChannels] = useState<('slack' | 'discord' | 'email' | 'telegram')[]>([
    'slack',
    'discord',
  ]);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Pagination for monitored targets
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const pageSize = 4;

  const handleManualCheck = async (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    setCheckingIds((prev) => ({ ...prev, [siteId]: true }));
    try {
      await onTriggerCheck(siteId);
    } finally {
      setCheckingIds((prev) => ({ ...prev, [siteId]: false }));
    }
  };

  const handleQuickSubmit = async () => {
    if (!quickName.trim() || !quickUrl.trim()) return;
    try {
      setIsSubmittingQuick(true);
      await onQuickAdd({
        name: quickName,
        url: quickUrl,
        checkInterval: quickInterval,
        selectorMode: quickSelectorMode,
        alertChannels: quickChannels,
      });
      setQuickName('');
      setQuickUrl('');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const toggleQuickChannel = (ch: 'slack' | 'discord' | 'email' | 'telegram') => {
    if (quickChannels.includes(ch)) {
      setQuickChannels(quickChannels.filter((c) => c !== ch));
    } else {
      setQuickChannels([...quickChannels, ch]);
    }
  };

  // Filtered websites
  const filteredWebsites = websites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.url.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (targetFilter === 'active') return site.status === 'healthy';
    if (targetFilter === 'alerts') return site.status === 'alert';
    if (targetFilter === 'paused') return site.status === 'paused';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWebsites.length / pageSize));
  const displayedWebsites = filteredWebsites.slice(
    (currentPageNum - 1) * pageSize,
    currentPageNum * pageSize
  );

  const activeCount = websites.filter((w) => w.status === 'healthy').length;
  const alertCount = websites.filter((w) => w.status === 'alert').length;
  const pausedCount = websites.filter((w) => w.status === 'paused').length;

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* 1. FOUR STAT CARDS ACROSS TOP */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {/* Stat 1: Total Websites */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-md hover:border-primary/40 transition-all duration-200 group">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant font-semibold">
              Total Websites
            </span>
            <span className="material-symbols-outlined text-primary text-xl" data-icon="language">
              language
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
              {websites.length}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high border border-outline-variant text-primary font-semibold">
              <span className="material-symbols-outlined text-xs" data-icon="trending_up">
                trending_up
              </span>
              {stats.totalWebsitesDelta}
            </span>
          </div>
          {/* Sparkline representation */}
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-body-sm font-body-sm text-outline">
            <div className="flex items-end gap-1 h-6 w-28">
              <span className="w-1.5 h-2 bg-primary/30 rounded-t-sm"></span>
              <span className="w-1.5 h-3 bg-primary/40 rounded-t-sm"></span>
              <span className="w-1.5 h-2.5 bg-primary/40 rounded-t-sm"></span>
              <span className="w-1.5 h-4 bg-primary/60 rounded-t-sm"></span>
              <span className="w-1.5 h-3.5 bg-primary/60 rounded-t-sm"></span>
              <span className="w-1.5 h-5 bg-primary/80 rounded-t-sm"></span>
              <span className="w-1.5 h-6 bg-primary rounded-t-sm"></span>
            </div>
            <span>Pool capacity: {stats.poolCapacityPercent}%</span>
          </div>
        </div>

        {/* Stat 2: Changes Detected */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-md hover:border-secondary/40 transition-all duration-200 group">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant font-semibold">
              Changes Detected
            </span>
            <span className="material-symbols-outlined text-secondary text-xl" data-icon="difference">
              difference
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
              {stats.changesDetected}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-container/40 border border-secondary/30 text-secondary-fixed font-semibold">
              <span className="material-symbols-outlined text-xs" data-icon="north_east">
                north_east
              </span>
              {stats.changesDetectedDelta}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-body-sm font-body-sm text-outline">
            <div className="flex items-end gap-1 h-6 w-28">
              <span className="w-1.5 h-4 bg-secondary/30 rounded-t-sm"></span>
              <span className="w-1.5 h-3 bg-secondary/40 rounded-t-sm"></span>
              <span className="w-1.5 h-5 bg-secondary/50 rounded-t-sm"></span>
              <span className="w-1.5 h-4 bg-secondary/60 rounded-t-sm"></span>
              <span className="w-1.5 h-6 bg-secondary/80 rounded-t-sm"></span>
              <span className="w-1.5 h-5 bg-secondary/70 rounded-t-sm"></span>
              <span className="w-1.5 h-6 bg-secondary rounded-t-sm"></span>
            </div>
            <span>DOM mutations: {stats.domMutationsCount}</span>
          </div>
        </div>

        {/* Stat 3: Healthy Websites */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-md hover:border-tertiary/40 transition-all duration-200 group">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant font-semibold">
              Healthy Websites
            </span>
            <span className="material-symbols-outlined text-tertiary text-xl" data-icon="check_circle">
              check_circle
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-headline-lg font-headline-lg font-bold text-tertiary tracking-tight">
              {activeCount}
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-label-sm bg-tertiary-container/30 border border-tertiary/30 text-tertiary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary pulse-dot"></span>
              {stats.healthyWebsitesPercent}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-body-sm font-body-sm text-outline">
            <span>Uptime SLA: {stats.uptimeSla}</span>
            <span className="text-tertiary font-label-sm font-semibold">SLA MET</span>
          </div>
        </div>

        {/* Stat 4: Monitoring Errors */}
        <div className="bg-surface-container-low border border-error/40 rounded-xl p-space-md hover:border-error transition-all duration-200 group">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-label-md font-label-md text-on-surface-variant font-semibold">
              Monitoring Errors
            </span>
            <span className="material-symbols-outlined text-error text-xl" data-icon="warning">
              warning
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-headline-lg font-headline-lg font-bold text-error tracking-tight">
              {alertCount}
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container/40 border border-error/40 text-error font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red"></span>
              {alertCount} sites unreachable
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-body-sm font-body-sm text-outline">
            <span>HTTP 502 Bad Gateway</span>
            <span className="text-error font-label-sm font-semibold">ATTENTION</span>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTION BANNER & EMBEDDED CONFIGURATION DRAWER */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-space-md border-b border-outline-variant/70 mb-space-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-2xl" data-icon="add_link">
                add_link
              </span>
            </div>
            <div>
              <div className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2 flex-wrap">
                <span>Deploy Fast Watchdog Monitor</span>
                <span className="text-label-sm font-label-sm uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-bold">
                  Zero Config Proxy
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">
                Configure high-frequency telemetry, DOM diff anchors, and incident notification webhooks in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface text-label-md font-label-md hover:bg-surface-container-high transition-colors"
            >
              System Defaults
            </button>
            <button
              onClick={handleQuickSubmit}
              disabled={isSubmittingQuick}
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed-dim transition-all shadow-sm glow-cyan active:scale-95 disabled:opacity-50"
            >
              {isSubmittingQuick ? 'Deploying...' : 'Save & Start Telemetry'}
            </button>
          </div>
        </div>

        {/* Inline Config Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md items-end">
          {/* Field 1: Website Name */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1.5">
              <span>Website Name</span>
              <span className="text-outline text-xs">*</span>
            </label>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="e.g. ACM Portal & Events"
            />
          </div>

          {/* Field 2: Target URL */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1.5">
              <span>Target URL</span>
              <span className="text-outline text-xs">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://acm.club.edu/events"
              />
              <span
                className="material-symbols-outlined text-outline absolute right-2.5 top-1/2 -translate-y-1/2 text-sm"
                data-icon="lock"
              >
                lock
              </span>
            </div>
          </div>

          {/* Field 3: Check Frequency Interval Dropdown */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-label-md font-label-md text-on-surface-variant">Check Frequency</label>
            <select
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={quickInterval}
              onChange={(e) => setQuickInterval(e.target.value)}
            >
              <option>Every 5 minutes</option>
              <option>Every 1 minute</option>
              <option>Hourly</option>
              <option>Daily</option>
            </select>
          </div>

          {/* Field 4: Selector Mode Dropdown */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-label-md font-label-md text-on-surface-variant">Selector Mode</label>
            <select
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={quickSelectorMode}
              onChange={(e) =>
                setQuickSelectorMode(
                  e.target.value as
                    | 'Full Page DOM'
                    | 'CSS Selector #content'
                    | 'Visual Screenshot Diff'
                    | 'Raw Markdown'
                )
              }
            >
              <option>Full Page DOM</option>
              <option>CSS Selector #content</option>
              <option>Visual Screenshot Diff</option>
              <option>Raw Markdown</option>
            </select>
          </div>

          {/* Field 5: Notification Checklist */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-label-md font-label-md text-on-surface-variant">Alert Channels</label>
            <div className="flex items-center gap-3 py-2 px-1">
              <label className="inline-flex items-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quickChannels.includes('slack')}
                  onChange={() => toggleQuickChannel('slack')}
                  className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Slack</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quickChannels.includes('discord')}
                  onChange={() => toggleQuickChannel('discord')}
                  className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Discord</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quickChannels.includes('email')}
                  onChange={() => toggleQuickChannel('email')}
                  className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Email</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPLIT WORKSPACE: MAIN TABLE (LEFT) & ACTIVITY STREAM (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* MAIN CENTRAL TABLE: Monitored Targets (8 Cols) */}
        <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          {/* Table Toolbar & Filters */}
          <div className="p-space-md border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low">
            <div className="flex items-center gap-2">
              <h2 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                Monitored Targets
              </h2>
              <span className="text-label-sm font-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant text-outline font-mono">
                Cluster US-EAST
              </span>
            </div>

            {/* Filter tabs & micro search */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex rounded-lg bg-surface-container-lowest p-0.5 border border-outline-variant text-label-sm font-label-sm">
                <button
                  onClick={() => setTargetFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    targetFilter === 'all'
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({websites.length})
                </button>
                <button
                  onClick={() => setTargetFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    targetFilter === 'active'
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setTargetFilter('alerts')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    targetFilter === 'alerts'
                      ? 'bg-error-container/30 text-error font-semibold shadow-xs'
                      : 'text-error hover:bg-error-container/20'
                  }`}
                >
                  Alerts ({alertCount})
                </button>
                <button
                  onClick={() => setTargetFilter('paused')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    targetFilter === 'paused'
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Paused ({pausedCount})
                </button>
              </div>

              <div className="relative w-40 sm:w-48">
                <span
                  className="material-symbols-outlined text-outline absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                  data-icon="filter_list"
                >
                  filter_list
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-3 py-1 text-label-md font-label-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                  placeholder="Filter targets..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table Component */}
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container text-label-sm font-label-sm text-outline uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4 font-semibold">Site & Domain</th>
                  <th className="py-3 px-4 font-semibold">Check Interval</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Last Checked</th>
                  <th className="py-3 px-4 font-semibold">Last Changed</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-body-sm font-body-sm">
                {displayedWebsites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-outline">
                      No matching monitored targets found.
                    </td>
                  </tr>
                ) : (
                  displayedWebsites.map((site) => {
                    const isAlert = site.status === 'alert';
                    const isPaused = site.status === 'paused';
                    const isChecking = checkingIds[site.id];

                    return (
                      <tr
                        key={site.id}
                        onClick={() => onSelectWebsite(site.id)}
                        className={`transition-colors group cursor-pointer ${
                          isAlert
                            ? 'bg-error-container/10 hover:bg-error-container/20'
                            : 'hover:bg-surface-container-high/50'
                        }`}
                      >
                        {/* Site & Domain */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono font-bold ${
                                isAlert
                                  ? 'bg-error-container/40 border-error/50 text-error'
                                  : 'bg-surface-container-high border-outline-variant text-primary'
                              }`}
                            >
                              {site.code}
                            </div>
                            <div>
                              <div
                                className={`font-label-lg font-semibold flex items-center gap-1.5 transition-colors ${
                                  isAlert ? 'text-error' : 'text-on-surface group-hover:text-primary'
                                }`}
                              >
                                <span>{site.name}</span>
                                {isAlert && (
                                  <span
                                    className="material-symbols-outlined text-xs text-error animate-pulse"
                                    data-icon="error"
                                  >
                                    error
                                  </span>
                                )}
                              </div>
                              <div className="text-body-sm text-outline flex items-center gap-1">
                                <span className="font-mono text-xs">{site.url.replace(/^https?:\/\//, '')}</span>
                                <a
                                  href={site.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-primary"
                                >
                                  <span
                                    className="material-symbols-outlined text-xs text-outline/80"
                                    data-icon="open_in_new"
                                  >
                                    open_in_new
                                  </span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Check Interval */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-outline text-label-sm font-label-sm font-mono border border-outline-variant/60">
                            {site.checkInterval}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isAlert ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-error-container/40 text-error border border-error/40 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red"></span>
                              {site.statusMessage}
                            </span>
                          ) : isPaused ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-outline border border-outline-variant font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-tertiary-container/20 text-tertiary border border-tertiary/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                              {site.statusMessage}
                            </span>
                          )}
                        </td>

                        {/* Last Checked */}
                        <td className="py-3 px-4">
                          <div
                            className={`flex items-center gap-1.5 font-mono text-body-sm ${
                              isAlert ? 'text-error font-semibold' : 'text-on-surface-variant'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAlert ? 'bg-error pulse-red' : 'bg-primary pulse-dot'
                              }`}
                            ></span>
                            {isChecking ? 'Checking...' : site.lastChecked}
                          </div>
                        </td>

                        {/* Last Changed */}
                        <td className="py-3 px-4">
                          {isAlert ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container/30 text-error border border-error/30 font-semibold">
                              Alert Triggered
                            </span>
                          ) : (
                            <span className="text-outline font-mono text-xs">{site.lastChanged}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={(e) => handleManualCheck(e, site.id)}
                              disabled={isChecking}
                              className={`p-1 rounded transition-colors ${
                                isAlert
                                  ? 'bg-error/20 hover:bg-error/30 text-error'
                                  : 'hover:bg-surface-container-highest text-on-surface-variant hover:text-primary'
                              }`}
                              title={isAlert ? 'Immediate Retry' : 'Force Re-check'}
                            >
                              <span
                                className={`material-symbols-outlined text-base ${
                                  isChecking ? 'animate-spin' : ''
                                }`}
                                data-icon="refresh"
                              >
                                refresh
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                onNavigate('diff');
                              }}
                              className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                              title="View Diff"
                            >
                              <span className="material-symbols-outlined text-base" data-icon="difference">
                                difference
                              </span>
                            </button>

                            <button
                              onClick={() => onSelectWebsite(site.id)}
                              className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Target Telemetry Details"
                            >
                              <span className="material-symbols-outlined text-base" data-icon="settings">
                                settings
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination / Summary */}
          <div className="p-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-body-sm font-body-sm text-outline">
            <div>
              Showing {displayedWebsites.length} of {filteredWebsites.length} configured targets
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
                className="px-2.5 py-1 rounded border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageNum >= totalPages}
                className="px-2.5 py-1 rounded border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* 4. RIGHT-HAND: RECENT CHANGES FEED & LIVE ACTIVITY STREAM (4 Cols) */}
        <section className="lg:col-span-4 space-y-gutter">
          {/* Activity Feed Card */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-md flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="update">
                  update
                </span>
                <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                  Recent Changes Feed
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-primary pulse-dot"></span>
            </div>

            {/* Feed Items */}
            <div className="space-y-3.5">
              {changes.length === 0 ? (
                <div className="p-6 text-center text-outline text-body-sm bg-surface-container rounded-lg border border-outline-variant space-y-1">
                  <p className="font-semibold text-on-surface">No Content Changes Yet</p>
                  <p className="text-xs">Monitored pages have remained identical since baseline capture.</p>
                </div>
              ) : (
                changes.slice(0, 3).map((chg) => (
                  <div
                    key={chg.id}
                    className="p-3 rounded-lg bg-surface-container border border-outline-variant hover:border-primary/50 transition-all duration-150"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-label-md font-label-md text-on-surface font-semibold truncate">
                        {chg.websiteUrl.replace(/^https?:\/\//, '')}
                      </div>
                      <span className="text-label-sm font-label-sm text-outline shrink-0 font-mono">
                        {chg.timeAgo}
                      </span>
                    </div>

                    {chg.wordsAdded > 0 || chg.wordsRemoved > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-tertiary-container/20 text-tertiary border border-tertiary/30 font-mono">
                          +{chg.wordsAdded} words added
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container/20 text-error border border-error/30 font-mono">
                          -{chg.wordsRemoved} words removed
                        </span>
                      </div>
                    ) : chg.visualMatchPercent ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-container/30 text-secondary border border-secondary/30">
                          <span className="material-symbols-outlined text-xs" data-icon="image">
                            image
                          </span>
                          {chg.summary}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container/30 text-error border border-error/30">
                          {chg.summary}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/60 flex items-center justify-between">
                      <span className="text-body-sm font-body-sm text-outline truncate max-w-[160px]">
                        Selector: {chg.selector}
                      </span>
                      <button
                        onClick={() => onNavigate('diff')}
                        className="inline-flex items-center gap-1 text-label-sm font-label-sm text-primary font-bold hover:underline"
                      >
                        <span>Inspect Diff</span>
                        <span className="material-symbols-outlined text-xs" data-icon="arrow_forward">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Health Status Summary Ring Widget */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-md font-label-md text-on-surface font-semibold">
                Infrastructure Integrity Ring
              </span>
              <span className="text-label-sm font-label-sm text-tertiary font-bold tracking-wider">
                CALIBRATED
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* Radial ring indicator simulated with SVG */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background ring */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.5"
                    stroke="#252a39"
                    strokeWidth="3"
                  ></circle>
                  {/* Tertiary / Healthy segment (91.6%) */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.5"
                    stroke="#4edea3"
                    strokeDasharray="91.6, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  ></circle>
                  {/* Error segment (8.4%) */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.5"
                    stroke="#ffb4ab"
                    strokeDasharray="8.4, 100"
                    strokeDashoffset="-91.6"
                    strokeLinecap="round"
                    strokeWidth="3"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-label-lg font-label-lg font-bold text-on-surface leading-none">
                    91.6%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-outline mt-0.5 font-bold">
                    HEALTH
                  </span>
                </div>
              </div>

              {/* Breakdown legend */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="text-on-surface-variant">{activeCount} Operational</span>
                  </div>
                  <span className="font-mono text-outline">91.6%</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <span className="text-on-surface-variant">{alertCount} Unreachable</span>
                  </div>
                  <span className="font-mono text-outline">8.4%</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span className="text-on-surface-variant">{pausedCount} Inactive/Paused</span>
                  </div>
                  <span className="font-mono text-outline">0.0%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-outline-variant/50 text-body-sm font-body-sm text-outline flex items-center justify-between">
              <span>
                Next synchronous audit in <strong>42s</strong>
              </span>
              <button
                onClick={onTriggerGlobalPing}
                className="text-primary hover:underline text-label-sm font-label-sm font-semibold"
              >
                Run Manual Ping
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
