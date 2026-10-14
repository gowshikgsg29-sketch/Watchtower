import React from 'react';
import {
  Activity,
  Globe,
  History,
  FileDiff,
  Settings as SettingsIcon,
  Radio,
  X,
} from 'lucide-react';

export type PageId = 'dashboard' | 'websites' | 'history' | 'diff' | 'settings' | 'details';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeCount?: number;
  totalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  activeCount = 24,
  totalCount = 30,
}) => {
  const quotaPercent = Math.min(100, Math.round((activeCount / totalCount) * 100));

  const navItems: Array<{ id: PageId; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'monitoring' },
    { id: 'websites', label: 'Monitored Websites', icon: 'language' },
    { id: 'history', label: 'Change History', icon: 'history' },
    { id: 'diff', label: 'Visual Diff Inspector', icon: 'difference' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`h-screen w-64 flex flex-col fixed left-0 top-0 border-r border-outline-variant bg-surface-container-lowest z-50 transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="w-64 h-full p-space-md flex flex-col justify-between shrink-0">
          {/* Top Brand Anchor */}
          <div>
            <div className="flex items-center justify-between px-2 py-3 mb-6">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  onNavigate('dashboard');
                  onCloseMobile();
                }}
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center relative shadow-sm">
                  <span className="material-symbols-outlined text-primary text-xl" data-icon="radar">
                    radar
                  </span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary pulse-dot"></span>
                </div>
                <div>
                  <div className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight leading-none">
                    Watchtower
                  </div>
                  <div className="text-body-sm font-body-sm text-outline mt-1 leading-none">
                    Club Core Infrastructure
                  </div>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                className="lg:hidden p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container"
                onClick={onCloseMobile}
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  currentPage === item.id ||
                  (item.id === 'websites' && currentPage === 'details');

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-label-md text-label-md transition-colors duration-150 text-left active:scale-[0.98] ${
                      isActive
                        ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        isActive ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                      data-icon={item.icon}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Quota & Telemetry Footer */}
          <div className="space-y-3 pt-4 border-t border-outline-variant">
            {/* Live Ping Status Item */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 text-outline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm" data-icon="sensors">
                  sensors
                </span>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                  Live Ping Status
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-label-sm font-label-sm text-tertiary font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary pulse-dot"></span>
                ACTIVE
              </span>
            </div>

            {/* Quota CTA Badge */}
            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant">
              <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mb-1.5">
                <span>Quota Utilization</span>
                <span className="text-primary font-semibold">{quotaPercent}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${quotaPercent}%` }}
                ></div>
              </div>
              <div className="mt-2 text-label-md font-label-md text-on-surface flex items-center justify-between">
                <span>
                  {activeCount}/{totalCount} active monitors
                </span>
                <button
                  onClick={() => onNavigate('settings')}
                  className="text-primary hover:underline text-label-sm font-label-sm font-bold"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
