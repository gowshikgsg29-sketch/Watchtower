import React, { useState, useEffect } from 'react';
import { Search, Globe, FileDiff, Settings, Plus, ExternalLink, X, ArrowRight } from 'lucide-react';
import { MonitoredWebsite } from '../types/monitor';
import { PageId } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  websites: MonitoredWebsite[];
  onSelectWebsite: (siteId: string) => void;
  onNavigate: (page: PageId) => void;
  onOpenAddModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  websites,
  onSelectWebsite,
  onNavigate,
  onOpenAddModal,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredWebsites = websites.filter(
    (w) =>
      w.name.toLowerCase().includes(query.toLowerCase()) ||
      w.url.toLowerCase().includes(query.toLowerCase()) ||
      w.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-outline-variant gap-3 bg-surface-container-lowest">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent text-body-lg text-on-surface placeholder:text-outline focus:outline-none"
            placeholder="Search monitors, jump to pages, or run commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container"
          >
            <kbd className="px-1.5 py-0.5 text-xs rounded bg-surface-container-high border border-outline-variant text-outline">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-label-sm font-label-sm text-outline uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => {
                  onOpenAddModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>+ Enroll New Website Target</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
              </button>

              <button
                onClick={() => {
                  onNavigate('diff');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                    <FileDiff className="w-3.5 h-3.5" />
                  </div>
                  <span>Open Visual Diff Inspector</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
              </button>

              <button
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <span>Configure Notification Rules & Webhooks</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary" />
              </button>
            </div>
          </div>

          {/* Monitored Websites List */}
          <div>
            <div className="px-3 py-1 text-label-sm font-label-sm text-outline uppercase tracking-wider flex items-center justify-between">
              <span>Monitored Targets</span>
              <span className="font-mono text-xs">{filteredWebsites.length} matches</span>
            </div>

            <div className="space-y-1 mt-1">
              {filteredWebsites.length === 0 ? (
                <div className="px-3 py-4 text-center text-outline text-body-sm">
                  No monitoring targets matching "{query}"
                </div>
              ) : (
                filteredWebsites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      onSelectWebsite(site.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono font-bold ${
                          site.status === 'alert'
                            ? 'bg-error-container/40 border-error/50 text-error'
                            : 'bg-surface-container-high border-outline-variant text-primary'
                        }`}
                      >
                        {site.code}
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface group-hover:text-primary flex items-center gap-2">
                          <span>{site.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              site.status === 'alert'
                                ? 'bg-error-container/40 text-error'
                                : site.status === 'paused'
                                ? 'bg-surface-container text-outline'
                                : 'bg-tertiary-container/20 text-tertiary'
                            }`}
                          >
                            {site.httpStatus}
                          </span>
                        </div>
                        <div className="text-xs text-outline font-mono truncate max-w-sm">
                          {site.url}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-outline font-mono">
                      <span>{site.checkInterval}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-outline-variant bg-surface-container text-xs text-outline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Use ↑ ↓ to navigate</span>
            <span>•</span>
            <span>Press ESC to dismiss</span>
          </div>
          <span className="text-primary font-mono">Telemetric Command Palette</span>
        </div>
      </div>
    </div>
  );
};
