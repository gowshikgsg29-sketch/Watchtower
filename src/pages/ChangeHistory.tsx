import React, { useState } from 'react';
import {
  History,
  Filter,
  Search,
  Calendar,
  ExternalLink,
  FileDiff,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  GitCommit,
  Image,
  Code,
} from 'lucide-react';
import { ChangeRecord, MonitoredWebsite } from '../types/monitor';

interface ChangeHistoryProps {
  changes: ChangeRecord[];
  websites: MonitoredWebsite[];
  onOpenDiff: (websiteId: string, oldSnapId?: string, newSnapId?: string) => void;
}

export const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  changes,
  websites,
  onOpenDiff,
}) => {
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChanges = changes.filter((chg) => {
    if (selectedWebsiteFilter !== 'all' && chg.websiteId !== selectedWebsiteFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && chg.changeType !== selectedTypeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        chg.websiteName.toLowerCase().includes(q) ||
        chg.websiteUrl.toLowerCase().includes(q) ||
        chg.summary.toLowerCase().includes(q) ||
        chg.selector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              Change History
            </h1>
            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-surface-container-high text-primary border border-outline-variant font-mono">
              Audit Chronology
            </span>
          </div>
          <p className="text-body-md text-outline mt-1">
            Chronological log of detected website modifications, DOM updates, and incident alerts across all monitored assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-outline font-mono text-xs">
            Total Logged Events: <span className="text-primary font-bold">{changes.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
          {/* Filter by Website */}
          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Target Website</label>
            <select
              value={selectedWebsiteFilter}
              onChange={(e) => setSelectedWebsiteFilter(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="all">All Monitored Targets</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Change Type */}
          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Mutation Type</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="all">All Mutation Types</option>
              <option value="text">Text Content Changes</option>
              <option value="dom">DOM Structural Changes</option>
              <option value="visual">Visual / Image Diff</option>
              <option value="git">Git Repository Commits</option>
              <option value="status_error">Service Incidents & Errors</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 self-end md:self-center">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search change logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-3 py-1.5 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="space-y-3">
        {filteredChanges.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-12 text-center space-y-2">
            <History className="w-8 h-8 text-outline mx-auto" />
            <h3 className="text-headline-sm font-semibold text-on-surface">No Change Events Found</h3>
            <p className="text-body-sm text-outline max-w-sm mx-auto">
              No audit logs matched your selected filters or search keyword.
            </p>
          </div>
        ) : (
          filteredChanges.map((chg) => {
            const isCritical = chg.severity === 'critical';
            const isMedium = chg.severity === 'medium';

            let typeIcon = <Code className="w-4 h-4 text-primary" />;
            if (chg.changeType === 'visual') typeIcon = <Image className="w-4 h-4 text-secondary" />;
            if (chg.changeType === 'git') typeIcon = <GitCommit className="w-4 h-4 text-on-surface-variant" />;
            if (chg.changeType === 'status_error') typeIcon = <AlertTriangle className="w-4 h-4 text-error" />;

            return (
              <div
                key={chg.id}
                className={`bg-surface-container-low border rounded-xl p-4 transition-all duration-150 hover:border-primary/40 ${
                  isCritical ? 'border-error/40 bg-error-container/10' : 'border-outline-variant'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                      {typeIcon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-on-surface text-sm">
                          {chg.websiteName}
                        </span>
                        <span className="text-xs text-outline font-mono">
                          ({chg.websiteUrl.replace(/^https?:\/\//, '')})
                        </span>
                        {isCritical && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-error-container/50 text-error border border-error/50">
                            Critical Alert
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-outline font-mono">
                        Selector Anchor: {chg.selector}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="font-mono text-xs text-outline">{chg.timeAgo}</span>
                    <button
                      onClick={() => onOpenDiff(chg.websiteId, chg.oldSnapshotId, chg.newSnapshotId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container font-semibold text-xs transition-colors"
                    >
                      <FileDiff className="w-3.5 h-3.5" />
                      <span>Inspect Diff</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Change Details */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-on-surface-variant font-medium flex-1">
                    {chg.summary}
                  </p>

                  <div className="flex items-center gap-2 shrink-0">
                    {chg.wordsAdded > 0 && (
                      <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-mono">
                        +{chg.wordsAdded} added
                      </span>
                    )}
                    {chg.wordsRemoved > 0 && (
                      <span className="px-2 py-0.5 rounded bg-error-container/20 text-error font-mono">
                        -{chg.wordsRemoved} removed
                      </span>
                    )}
                    {chg.visualMatchPercent && (
                      <span className="px-2 py-0.5 rounded bg-secondary-container/30 text-secondary font-mono">
                        {chg.visualMatchPercent}% visual match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
