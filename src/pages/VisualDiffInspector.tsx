import React, { useState, useMemo } from 'react';
import {
  FileDiff,
  Columns,
  List,
  Sliders,
  Calendar,
  Clock,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Maximize2,
  Copy,
} from 'lucide-react';
import { MonitoredWebsite, WebsiteSnapshot } from '../types/monitor';
import { computeLineDiff, computeSplitDiff, countWordChanges, computeSimilarityPercent } from '../utils/diff';

interface VisualDiffInspectorProps {
  websites: MonitoredWebsite[];
  snapshots: Record<string, WebsiteSnapshot[]>;
  initialWebsiteId?: string;
  initialOldSnapshotId?: string;
  initialNewSnapshotId?: string;
}

export const VisualDiffInspector: React.FC<VisualDiffInspectorProps> = ({
  websites,
  snapshots,
  initialWebsiteId,
  initialOldSnapshotId,
  initialNewSnapshotId,
}) => {
  // Selected target
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>(
    initialWebsiteId || websites[0]?.id || ''
  );

  const availableSnapshots = useMemo(() => {
    return snapshots[selectedWebsiteId] || [];
  }, [snapshots, selectedWebsiteId]);

  const [oldSnapshotId, setOldSnapshotId] = useState<string>(
    initialOldSnapshotId || ''
  );
  const [newSnapshotId, setNewSnapshotId] = useState<string>(
    initialNewSnapshotId || ''
  );

  // Sync selected website if initialWebsiteId changes from navigation
  React.useEffect(() => {
    if (initialWebsiteId) {
      setSelectedWebsiteId(initialWebsiteId);
    }
  }, [initialWebsiteId]);

  // Sync snapshot selections when website or snapshots change
  React.useEffect(() => {
    const snaps = snapshots[selectedWebsiteId] || [];
    if (snaps.length === 0) {
      setOldSnapshotId('');
      setNewSnapshotId('');
      return;
    }

    // If explicit initial IDs match snapshots in this website, use them
    const hasInitialOld = initialOldSnapshotId && snaps.some((s) => s.id === initialOldSnapshotId);
    const hasInitialNew = initialNewSnapshotId && snaps.some((s) => s.id === initialNewSnapshotId);

    if (hasInitialOld && hasInitialNew) {
      setOldSnapshotId(initialOldSnapshotId!);
      setNewSnapshotId(initialNewSnapshotId!);
    } else {
      if (snaps.length >= 2) {
        setNewSnapshotId(snaps[0].id);
        setOldSnapshotId(snaps[1].id);
      } else if (snaps.length === 1) {
        setNewSnapshotId(snaps[0].id);
        setOldSnapshotId(snaps[0].id);
      }
    }
  }, [selectedWebsiteId, snapshots, initialOldSnapshotId, initialNewSnapshotId]);

  // Diff view mode: 'split' | 'unified' | 'visual_slider'
  const [diffMode, setDiffMode] = useState<'split' | 'unified' | 'visual_slider'>('split');
  // Visual slider position (0 - 100%)
  const [sliderPosition, setSliderPosition] = useState(50);

  const selectedWebsite = websites.find((w) => w.id === selectedWebsiteId);
  const oldSnap = availableSnapshots.find((s) => s.id === oldSnapshotId) || availableSnapshots[1] || availableSnapshots[0];
  const newSnap = availableSnapshots.find((s) => s.id === newSnapshotId) || availableSnapshots[0];

  const oldText = oldSnap?.textContent || '';
  const newText = newSnap?.textContent || '';

  const splitRows = useMemo(() => computeSplitDiff(oldText, newText), [oldText, newText]);
  const unifiedLines = useMemo(() => computeLineDiff(oldText, newText), [oldText, newText]);
  const wordStats = useMemo(() => countWordChanges(oldText, newText), [oldText, newText]);
  const similarityPercent = useMemo(() => computeSimilarityPercent(oldText, newText), [oldText, newText]);

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              Visual Diff Inspector
            </h1>
            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-secondary-container/40 text-secondary-fixed border border-secondary/30 font-mono font-bold">
              DOM Mutation Analyzer
            </span>
          </div>
          <p className="text-body-md text-outline mt-1">
            Compare structured text mutations, character additions, and visual changes between monitoring snapshots.
          </p>
        </div>

        {/* Change stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tertiary-container/20 text-tertiary border border-tertiary/30 font-mono text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" />
            <span>+{wordStats.added} words added</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container/20 text-error border border-error/30 font-mono text-xs font-semibold">
            <Minus className="w-3.5 h-3.5" />
            <span>-{wordStats.removed} words removed</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant border border-outline-variant font-mono text-xs">
            DOM Similarity: {similarityPercent}%
          </span>
        </div>
      </div>

      {/* Control Panel: Target Selector, Version Dropdowns & View Toggles */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Target Website */}
          <div>
            <label className="text-xs font-semibold text-outline block mb-1">Target Website</label>
            <select
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  [{w.code}] {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Old Baseline Version */}
          <div>
            <label className="text-xs font-semibold text-outline block mb-1">
              Base Version (Original)
            </label>
            <select
              value={oldSnapshotId}
              onChange={(e) => setOldSnapshotId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {availableSnapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.versionTag} — {new Date(s.timestamp).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>

          {/* New Target Version */}
          <div>
            <label className="text-xs font-semibold text-outline block mb-1">
              Target Version (Newer)
            </label>
            <select
              value={newSnapshotId}
              onChange={(e) => setNewSnapshotId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {availableSnapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.versionTag} — {new Date(s.timestamp).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center self-end lg:self-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant">
          <button
            onClick={() => setDiffMode('split')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffMode === 'split'
                ? 'bg-surface-container-high text-primary shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setDiffMode('unified')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffMode === 'unified'
                ? 'bg-surface-container-high text-primary shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Unified Diff</span>
          </button>

          <button
            onClick={() => setDiffMode('visual_slider')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffMode === 'visual_slider'
                ? 'bg-surface-container-high text-secondary shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Visual Slider</span>
          </button>
        </div>
      </div>

      {/* Main Diff Content Container */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Diff Mode 1: Split Side-by-Side View */}
        {diffMode === 'split' && (
          <div className="overflow-x-auto custom-scrollbar">
            {/* Headers */}
            <div className="grid grid-cols-2 border-b border-outline-variant bg-surface-container text-xs font-semibold font-mono text-outline sticky top-0">
              <div className="p-3 border-r border-outline-variant flex items-center justify-between">
                <span>BEFORE: {oldSnap?.versionTag || 'Base Version'}</span>
                <span>{oldSnap?.timestamp ? new Date(oldSnap.timestamp).toLocaleTimeString() : ''}</span>
              </div>
              <div className="p-3 flex items-center justify-between text-primary">
                <span>AFTER: {newSnap?.versionTag || 'Current Version'}</span>
                <span>{newSnap?.timestamp ? new Date(newSnap.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            </div>

            {/* Split Rows */}
            <div className="divide-y divide-outline-variant/30 font-mono text-xs leading-relaxed">
              {splitRows.map((row, idx) => {
                const isModified = row.type === 'modified';
                const isRemoved = row.type === 'removed';
                const isAdded = row.type === 'added';

                return (
                  <div key={idx} className="grid grid-cols-2">
                    {/* Left Column (Old) */}
                    <div
                      className={`p-2.5 border-r border-outline-variant flex items-start gap-3 ${
                        isRemoved
                          ? 'bg-error-container/15 text-error border-l-2 border-l-error'
                          : isModified
                          ? 'bg-error-container/10 text-error'
                          : 'text-on-surface'
                      }`}
                    >
                      <span className="w-8 shrink-0 select-none text-right text-outline/60 text-[11px]">
                        {row.oldLineNumber || ''}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {row.oldContent || ''}
                      </span>
                    </div>

                    {/* Right Column (New) */}
                    <div
                      className={`p-2.5 flex items-start gap-3 ${
                        isAdded
                          ? 'bg-tertiary-container/15 text-tertiary border-l-2 border-l-tertiary'
                          : isModified
                          ? 'bg-tertiary-container/10 text-tertiary'
                          : 'text-on-surface'
                      }`}
                    >
                      <span className="w-8 shrink-0 select-none text-right text-outline/60 text-[11px]">
                        {row.newLineNumber || ''}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {row.newContent || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Diff Mode 2: Unified Diff View */}
        {diffMode === 'unified' && (
          <div className="overflow-x-auto custom-scrollbar font-mono text-xs">
            <div className="p-3 bg-surface-container border-b border-outline-variant text-xs font-semibold text-outline flex items-center justify-between">
              <span>UNIFIED DIFF: @@ {selectedWebsite?.name} @@</span>
              <span>{unifiedLines.length} lines analyzed</span>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {unifiedLines.map((line, idx) => {
                const isAdd = line.type === 'added';
                const isRem = line.type === 'removed';

                return (
                  <div
                    key={idx}
                    className={`p-2 flex items-start gap-3 ${
                      isAdd
                        ? 'bg-tertiary-container/15 text-tertiary border-l-2 border-l-tertiary'
                        : isRem
                        ? 'bg-error-container/15 text-error border-l-2 border-l-error'
                        : 'text-on-surface'
                    }`}
                  >
                    <span className="w-8 shrink-0 select-none text-right text-outline/60 text-[11px]">
                      {line.oldLineNumber || line.newLineNumber || ''}
                    </span>
                    <span className="w-4 shrink-0 select-none font-bold">
                      {isAdd ? '+' : isRem ? '-' : ' '}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Diff Mode 3: Interactive Visual Screenshot Diff Slider */}
        {diffMode === 'visual_slider' && (
          <div className="p-6 flex flex-col items-center">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-on-surface text-sm">
                Interactive Visual Snapshot Split Slider
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Drag the slider handle to inspect visual mutations between render snapshots.
              </p>
            </div>

            {/* Slider Mock Frame */}
            <div className="relative w-full max-w-3xl h-96 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden select-none">
              {/* Left / Old Layer */}
              <div
                className="absolute inset-0 bg-surface-container p-6 text-xs font-mono text-on-surface"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <div className="p-3 rounded bg-surface-container-high border border-outline-variant mb-3 flex items-center justify-between">
                  <span className="text-outline">Snapshot Baseline (v3.1)</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-xs">
                    Original Schedule
                  </span>
                </div>
                <div className="space-y-3 opacity-80">
                  <div className="h-6 bg-surface-container-high rounded w-3/4"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
                  <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant space-y-2">
                    <p className="text-on-surface font-semibold">11:00 AM - Keynote Address: Elena Vance</p>
                    <p className="text-outline text-xs">Single presenter announced.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant space-y-2">
                    <p className="text-on-surface font-semibold">05:00 PM - Workshop: Intelligent Agents</p>
                    <p className="text-outline text-xs">Standard evening track.</p>
                  </div>
                </div>
              </div>

              {/* Right / New Layer */}
              <div
                className="absolute inset-0 bg-surface-container-high/60 p-6 text-xs font-mono text-on-surface"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <div className="p-3 rounded bg-primary-container/20 border border-primary/30 mb-3 flex items-center justify-between text-primary">
                  <span>Mutated Snapshot (v3.2 Current)</span>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-bold text-xs">
                    Live Diff Detected
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-primary/20 border border-primary/30 rounded w-3/4"></div>
                  <div className="h-4 bg-primary/20 border border-primary/30 rounded w-1/2"></div>
                  <div className="p-4 rounded-lg bg-tertiary-container/20 border border-tertiary/40 space-y-2 text-tertiary">
                    <p className="font-semibold">+ 10:45 AM - Sponsor Tech Talks: Autonomous Telemetry</p>
                    <p className="text-on-surface font-semibold">+ 11:30 AM - Keynote: Elena Vance & Sarah Lin</p>
                    <p className="text-outline text-xs">Updated speaker duo and timing adjustment.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-tertiary-container/20 border border-tertiary/40 space-y-2 text-tertiary">
                    <p className="font-semibold">+ 04:30 PM - Workshop: Web Change Detectors with Playwright</p>
                    <p className="text-outline text-xs">Moved up 30 minutes with Playwright lab integration.</p>
                  </div>
                </div>
              </div>

              {/* Slider Handle Divider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize z-20 flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center glow-cyan shadow-lg text-xs">
                  ↔
                </div>
              </div>

              {/* Invisible Range Input for Dragging */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
              />
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-outline">
              <span>Original Snapshot: 0%</span>
              <span className="text-primary font-semibold">Slider: {sliderPosition}%</span>
              <span>Updated Snapshot: 100%</span>
            </div>
          </div>
        )}

        {/* Footer info bar */}
        <div className="p-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-xs text-outline">
          <div className="flex items-center gap-2">
            <span>Selector Anchor: {selectedWebsite?.cssSelector || '#content'}</span>
            <span>•</span>
            <span>Noise suppression enabled (timestamps stripped)</span>
          </div>
          <span className="font-mono text-tertiary">All DOM markers validated</span>
        </div>
      </div>
    </div>
  );
};
