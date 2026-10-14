import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  FileDiff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Code2,
  Bell,
  Play,
  Pause,
  Copy,
  Check,
} from 'lucide-react';
import { MonitoredWebsite, WebsiteSnapshot } from '../types/monitor';
import { PageId } from '../components/Sidebar';

interface WebsiteDetailsProps {
  website: MonitoredWebsite;
  snapshots: WebsiteSnapshot[];
  onBack: () => void;
  onNavigate: (page: PageId) => void;
  onTriggerCheck: (id: string) => Promise<void>;
  onTogglePause: (id: string) => Promise<void>;
  onSelectForDiff: (websiteId: string, oldSnapId?: string, newSnapId?: string) => void;
  onUpdateInterval?: (id: string, interval: string) => Promise<void>;
}

export const WebsiteDetails: React.FC<WebsiteDetailsProps> = ({
  website,
  snapshots,
  onBack,
  onNavigate,
  onTriggerCheck,
  onTogglePause,
  onSelectForDiff,
  onUpdateInterval,
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    snapshots[0]?.id || ''
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (snapshots.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(snapshots[0].id);
    }
  }, [snapshots, selectedSnapshotId]);

  const activeSnapshot =
    snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];

  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      await onTriggerCheck(website.id);
    } finally {
      setIsChecking(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(website.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAlert = website.status === 'alert';
  const isPaused = website.status === 'paused';

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-label-md font-semibold text-outline hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monitored Targets</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onTogglePause(website.id)}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-body-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
          >
            {isPaused ? <Play className="w-4 h-4 text-tertiary" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume Monitoring' : 'Pause Monitor'}</span>
          </button>

          <button
            onClick={handleCheckNow}
            disabled={isChecking}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold hover:bg-primary transition-all glow-cyan shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Executing Ping...' : 'Check Now'}</span>
          </button>
        </div>
      </div>

      {/* Target Header Hero */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/70 mb-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-lg ${
                isAlert
                  ? 'bg-error-container/40 border-error/50 text-error'
                  : 'bg-surface-container-high border-outline-variant text-primary'
              }`}
            >
              {website.code}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-headline-md font-bold text-on-surface">{website.name}</h1>
                {isAlert ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-error-container/40 text-error border border-error/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red"></span>
                    {website.httpStatus} Incident Active
                  </span>
                ) : isPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-surface-container text-outline border border-outline-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-tertiary-container/20 text-tertiary border border-tertiary/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary pulse-dot"></span>
                    Healthy (200 OK)
                  </span>
                )}
                <span className="text-label-sm uppercase px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-outline font-mono">
                  {website.cluster || 'Cluster US-EAST'}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-body-sm text-outline font-mono">
                <span>{website.url}</span>
                <button
                  onClick={copyUrl}
                  className="hover:text-primary transition-colors flex items-center gap-1 text-xs"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Target</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectForDiff(website.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-primary font-label-md font-bold hover:bg-surface-container-highest transition-colors"
            >
              <FileDiff className="w-4 h-4" />
              <span>Inspect Live Diff</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <div className="flex items-center justify-between mb-1">
              <span className="text-outline">Check Frequency</span>
              {isUpdatingInterval && <RefreshCw className="w-3 h-3 text-primary animate-spin" />}
            </div>
            <select
              value={website.checkInterval}
              disabled={isUpdatingInterval}
              onChange={async (e) => {
                const newInterval = e.target.value;
                if (onUpdateInterval) {
                  setIsUpdatingInterval(true);
                  try {
                    await onUpdateInterval(website.id, newInterval);
                  } finally {
                    setIsUpdatingInterval(false);
                  }
                }
              }}
              className="w-full bg-surface-container-high border border-outline-variant rounded px-2 py-1 font-mono text-xs text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
            >
              <option value="Every 1 minute">Every 1 minute</option>
              <option value="Every 5 minutes">Every 5 minutes</option>
              <option value="Every 10 minutes">Every 10 minutes</option>
              <option value="Every 15 minutes">Every 15 minutes</option>
              <option value="Every 30 minutes">Every 30 minutes</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
            </select>
            <span className="text-[11px] text-outline block mt-1">Updates scheduler job</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span className="text-outline block mb-1">Last Checked</span>
            <span className="font-mono text-sm text-on-surface font-semibold flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAlert ? 'bg-error pulse-red' : 'bg-primary pulse-dot'
                }`}
              ></span>
              {website.lastChecked}
            </span>
            <span className="text-[11px] text-outline block mt-0.5">Latency: {website.avgResponseMs}ms</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span className="text-outline block mb-1">Last Content Change</span>
            <span className="font-mono text-sm text-on-surface font-semibold">{website.lastChanged}</span>
            <span className="text-[11px] text-outline block mt-0.5">{website.changeCount} mutations logged</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span className="text-outline block mb-1">Observed Uptime SLA</span>
            <span className="font-mono text-sm text-tertiary font-semibold">{website.uptimePercent}%</span>
            <span className="text-[11px] text-outline block mt-0.5">30-day rolling window</span>
          </div>
        </div>

        {/* Error Diagnostics if Alert */}
        {isAlert && website.lastError && (
          <div className="mt-4 p-4 rounded-xl bg-error-container/20 border border-error/50 text-error">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span>Diagnostic Failure Trace: {website.statusMessage}</span>
            </div>
            <pre className="text-xs font-mono bg-surface-container-lowest/70 p-3 rounded-lg border border-error/30 overflow-x-auto text-on-surface">
              {website.lastError}
            </pre>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleCheckNow}
                disabled={isChecking}
                className="px-3 py-1 rounded bg-error/30 hover:bg-error/40 text-error font-semibold text-xs border border-error/50 transition-colors"
              >
                Trigger Immediate Diagnostic Re-check
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Versions Explorer & Content Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Snapshot Version Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-space-md">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-3">
            <h3 className="font-semibold text-on-surface flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span>Historical Snapshots</span>
            </h3>
            <span className="text-xs text-outline font-mono">{snapshots.length} versions</span>
          </div>

          <div className="space-y-2">
            {snapshots.length === 0 ? (
              <p className="text-outline text-xs py-4 text-center">No snapshots recorded yet.</p>
            ) : (
              snapshots.map((snap, index) => {
                const isSelected = snap.id === (activeSnapshot?.id || '');
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotId(snap.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-high border-primary text-on-surface'
                        : 'bg-surface-container border-outline-variant/70 hover:border-outline text-outline hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {snap.versionTag}
                      </span>
                      <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="text-xs text-outline line-clamp-2">
                      {snap.changeSummary || 'Routine automated snapshot capture.'}
                    </div>

                    <div className="mt-2 pt-2 border-t border-outline-variant/50 flex items-center justify-between text-[11px] font-mono">
                      <span>{snap.wordCount} words</span>
                      <span className="text-tertiary">HTTP {snap.httpStatus}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action to Compare */}
          {snapshots.length >= 2 && (
            <div className="mt-4 pt-3 border-t border-outline-variant">
              <button
                onClick={() => onSelectForDiff(website.id, snapshots[1].id, snapshots[0].id)}
                className="w-full py-2 rounded-lg bg-surface-container border border-outline-variant text-primary hover:bg-surface-container-high font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <FileDiff className="w-3.5 h-3.5" />
                <span>Compare v{snapshots[0].versionTag.split(' ')[0]} with Previous</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Selected Snapshot Text Preview (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-space-md flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-on-surface text-sm">
                Captured DOM Text — {activeSnapshot?.versionTag || 'Current'}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-outline">
              <span>Selector: {website.cssSelector || 'Full DOM'}</span>
              <span>•</span>
              <span>{activeSnapshot?.wordCount || 0} words</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 font-mono text-xs leading-relaxed text-on-surface custom-scrollbar overflow-auto max-h-[460px] whitespace-pre-wrap flex-1">
            {activeSnapshot?.textContent || 'No text extracted for this snapshot.'}
          </div>

          <div className="mt-3 pt-3 border-t border-outline-variant flex items-center justify-between text-xs text-outline">
            <span>Cleaned DOM text with whitespace and noise filter normalization applied.</span>
            <button
              onClick={() => onSelectForDiff(website.id)}
              className="text-primary hover:underline font-semibold"
            >
              Launch Side-by-Side Comparison →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
