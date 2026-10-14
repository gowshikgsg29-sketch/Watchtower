import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Globe,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { MonitoredWebsite } from '../types/monitor';

interface MonitoredWebsitesProps {
  websites: MonitoredWebsite[];
  onOpenAddModal: () => void;
  onSelectWebsite: (id: string) => void;
  onTogglePause: (id: string) => Promise<void>;
  onDeleteWebsite: (id: string) => Promise<void>;
  onTriggerCheck: (id: string) => Promise<void>;
}

export const MonitoredWebsites: React.FC<MonitoredWebsitesProps> = ({
  websites,
  onOpenAddModal,
  onSelectWebsite,
  onTogglePause,
  onDeleteWebsite,
  onTriggerCheck,
}) => {
  const [filter, setFilter] = useState<'all' | 'healthy' | 'alert' | 'paused'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [checkingIds, setCheckingIds] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = websites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.url.toLowerCase().includes(search.toLowerCase()) ||
      site.code.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'healthy') return site.status === 'healthy';
    if (filter === 'alert') return site.status === 'alert';
    if (filter === 'paused') return site.status === 'paused';
    return true;
  });

  const handleCheck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCheckingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await onTriggerCheck(id);
    } finally {
      setCheckingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePauseResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onTogglePause(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      await onDeleteWebsite(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === id ? null : curr));
      }, 4000);
    }
  };

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              Monitored Targets
            </h1>
            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-surface-container-high text-primary border border-outline-variant font-mono">
              Cluster Registry
            </span>
          </div>
          <p className="text-body-md text-outline mt-1">
            Manage target websites, check intervals, custom DOM selector targets, and real-time health telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-lg font-bold hover:bg-primary transition-all glow-cyan active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitor Target</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters, Search, View Switcher */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-surface-container-high text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Targets ({websites.length})
          </button>
          <button
            onClick={() => setFilter('healthy')}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filter === 'healthy'
                ? 'bg-tertiary-container/30 text-tertiary shadow-xs'
                : 'text-tertiary hover:bg-tertiary-container/10'
            }`}
          >
            Healthy ({websites.filter((w) => w.status === 'healthy').length})
          </button>
          <button
            onClick={() => setFilter('alert')}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filter === 'alert'
                ? 'bg-error-container/40 text-error shadow-xs'
                : 'text-error hover:bg-error-container/20'
            }`}
          >
            Alerts ({websites.filter((w) => w.status === 'alert').length})
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filter === 'paused'
                ? 'bg-surface-container-high text-primary shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Paused ({websites.filter((w) => w.status === 'paused').length})
          </button>
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, URL, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-3 py-1.5 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="hidden sm:flex items-center rounded-lg bg-surface-container-lowest border border-outline-variant p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'text-outline'
              }`}
              title="Grid View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${
                viewMode === 'table' ? 'bg-surface-container-high text-primary' : 'text-outline'
              }`}
              title="Table View"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Content: Grid or Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-high text-outline mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-headline-sm font-semibold text-on-surface">No Targets Match Criteria</h3>
          <p className="text-body-sm text-outline max-w-md mx-auto">
            Try adjusting your search query or filter pills, or register a new target URL endpoint.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-semibold hover:bg-primary transition-all text-sm mt-2"
          >
            + Add New Target
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((site) => {
            const isAlert = site.status === 'alert';
            const isPaused = site.status === 'paused';
            const isChecking = checkingIds[site.id];

            return (
              <div
                key={site.id}
                onClick={() => onSelectWebsite(site.id)}
                className={`bg-surface-container-low border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:shadow-lg ${
                  isAlert
                    ? 'border-error/50 hover:border-error bg-error-container/10'
                    : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-mono font-bold ${
                          isAlert
                            ? 'bg-error-container/40 border-error/50 text-error'
                            : 'bg-surface-container-high border-outline-variant text-primary'
                        }`}
                      >
                        {site.code}
                      </div>
                      <div>
                        <h3
                          className={`font-label-lg font-semibold transition-colors flex items-center gap-1.5 ${
                            isAlert ? 'text-error' : 'text-on-surface group-hover:text-primary'
                          }`}
                        >
                          <span>{site.name}</span>
                          {isAlert && <AlertTriangle className="w-3.5 h-3.5 text-error animate-pulse" />}
                        </h3>
                        <div className="text-body-sm text-outline flex items-center gap-1 font-mono text-xs mt-0.5">
                          <span className="truncate max-w-[200px]">{site.url.replace(/^https?:\/\//, '')}</span>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary"
                          >
                            <ExternalLink className="w-3 h-3 text-outline/80" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isAlert ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-semibold bg-error-container/40 text-error border border-error/40 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red"></span>
                        {site.httpStatus} Error
                      </span>
                    ) : isPaused ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-semibold bg-surface-container text-outline border border-outline-variant shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                        Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-semibold bg-tertiary-container/20 text-tertiary border border-tertiary/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        200 OK
                      </span>
                    )}
                  </div>

                  {/* Error Callout if Alert */}
                  {isAlert && site.lastError && (
                    <div className="p-2.5 rounded-lg bg-error-container/30 border border-error/40 text-error text-xs font-mono mb-3">
                      {site.lastError}
                    </div>
                  )}

                  {/* Telemetry Matrix Grid */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-outline-variant/60 text-xs">
                    <div>
                      <span className="text-outline block">Frequency</span>
                      <span className="font-mono text-on-surface font-semibold">{site.checkInterval}</span>
                    </div>
                    <div>
                      <span className="text-outline block">Selector Scope</span>
                      <span className="text-on-surface truncate block font-mono" title={site.selectorMode}>
                        {site.selectorMode}
                      </span>
                    </div>
                    <div>
                      <span className="text-outline block">Last Checked</span>
                      <span className="font-mono text-on-surface flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAlert ? 'bg-error' : isPaused ? 'bg-outline' : 'bg-primary pulse-dot'
                          }`}
                        ></span>
                        {site.lastChecked}
                      </span>
                    </div>
                    <div>
                      <span className="text-outline block">Response Latency</span>
                      <span className="font-mono text-on-surface font-semibold">{site.avgResponseMs}ms</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  className="mt-4 pt-2 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Re-check */}
                    <button
                      onClick={(e) => handleCheck(e, site.id)}
                      disabled={isChecking}
                      className="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                      title="Force Immediate Check"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-primary' : ''}`} />
                      <span>{isChecking ? 'Checking...' : 'Check'}</span>
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={(e) => handlePauseResume(e, site.id)}
                      className="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 font-semibold"
                      title={isPaused ? 'Resume Monitoring' : 'Pause Monitoring'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 text-tertiary" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, site.id)}
                      className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                        deleteConfirmId === site.id
                          ? 'bg-error text-on-error font-bold'
                          : 'hover:bg-error-container/20 text-outline hover:text-error'
                      }`}
                      title={deleteConfirmId === site.id ? 'Click again to confirm delete' : 'Delete Monitor'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleteConfirmId === site.id && <span>Confirm</span>}
                    </button>

                    {/* Go to Details */}
                    <button
                      onClick={() => onSelectWebsite(site.id)}
                      className="p-1.5 rounded hover:bg-surface-container-high text-primary flex items-center gap-0.5 font-bold"
                    >
                      <span>Telemetry</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container text-label-sm font-label-sm text-outline uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Target Domain</th>
                  <th className="py-3 px-4 font-semibold">Frequency</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Last Checked</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-body-sm font-body-sm">
                {filtered.map((site) => {
                  const isAlert = site.status === 'alert';
                  const isPaused = site.status === 'paused';
                  const isChecking = checkingIds[site.id];

                  return (
                    <tr
                      key={site.id}
                      onClick={() => onSelectWebsite(site.id)}
                      className={`transition-colors group cursor-pointer ${
                        isAlert ? 'bg-error-container/10 hover:bg-error-container/20' : 'hover:bg-surface-container-high/50'
                      }`}
                    >
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
                            <div className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {site.name}
                            </div>
                            <div className="text-xs text-outline font-mono">{site.url}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">{site.checkInterval}</td>

                      <td className="py-3 px-4">
                        {isAlert ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container/40 text-error border border-error/40">
                            {site.httpStatus} Error
                          </span>
                        ) : isPaused ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-surface-container text-outline border border-outline-variant">
                            Paused
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/20 text-tertiary border border-tertiary/30">
                            200 OK
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">{site.avgResponseMs}ms</td>

                      <td className="py-3 px-4 font-mono text-xs">{isChecking ? 'Checking...' : site.lastChecked}</td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => handleCheck(e, site.id)}
                            className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary"
                            title="Force Re-check"
                          >
                            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-primary' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handlePauseResume(e, site.id)}
                            className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant"
                            title={isPaused ? 'Resume' : 'Pause'}
                          >
                            {isPaused ? <Play className="w-4 h-4 text-tertiary" /> : <Pause className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, site.id)}
                            className={`p-1 rounded ${
                              deleteConfirmId === site.id ? 'bg-error text-on-error' : 'hover:bg-error-container/20 text-outline hover:text-error'
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
