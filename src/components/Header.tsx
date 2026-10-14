import React, { useState } from 'react';
import { Menu, Bell, Radio, Plus, Search, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  pageTitle?: string;
  onOpenAddModal: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileNav: () => void;
  hostsCount?: number;
  avgPingMs?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  pageTitle,
  onOpenAddModal,
  onOpenCommandPalette,
  onToggleMobileNav,
  hostsCount = 24,
  avgPingMs = 24,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumb = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard / Overview';
      case 'websites':
        return 'Monitored Targets / Registry';
      case 'history':
        return 'Audit Logs / Change History';
      case 'diff':
        return 'Telemetry / Visual Diff Inspector';
      case 'settings':
        return 'Configuration / System Rules';
      case 'details':
        return `Target Telemetry / ${pageTitle || 'Details'}`;
      default:
        return 'Watchtower / Overview';
    }
  };

  return (
    <header className="flex justify-between items-center h-16 px-4 sm:px-gutter-md w-full sticky top-0 z-40 bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant">
      {/* Left: Mobile Toggle & Breadcrumb / Global Search */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-2xl">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb & Environment Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-label-lg font-label-lg font-semibold text-on-surface truncate max-w-[150px] sm:max-w-none">
            {getBreadcrumb()}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-surface-container-high text-primary border border-outline-variant font-bold">
            Production
          </span>
        </div>

        {/* Search Bar with ⌘K Command Palette trigger */}
        <div className="relative w-full max-w-xs sm:max-w-md hidden md:block">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none"
            data-icon="search"
          >
            search
          </span>
          <input
            onClick={onOpenCommandPalette}
            readOnly
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-9 pr-14 py-1.5 text-body-sm font-body-sm text-on-surface placeholder:text-outline cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
            placeholder="Search monitors, domains, selectors... [⌘K]"
            type="text"
          />
          <kbd
            onClick={onOpenCommandPalette}
            className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-label-sm font-label-sm rounded bg-surface-container-high border border-outline-variant text-outline select-none hover:text-primary"
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Trailing Actions, Live Status, + Add Website Button, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden w-9 h-9 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center"
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live ping indicator badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/80 border border-outline-variant text-label-md font-label-md text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-tertiary pulse-dot"></span>
          <span className="text-on-surface">Pinging {hostsCount} hosts</span>
          <span className="text-outline text-label-sm font-label-sm">(avg {avgPingMs}ms)</span>
        </div>

        {/* Trailing Icon Actions */}
        <div className="flex items-center gap-1 relative">
          <button
            className="w-9 h-9 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors duration-150"
            title="Telemetry Sensors Active"
          >
            <span className="material-symbols-outlined text-xl" data-icon="sensors">
              sensors
            </span>
          </button>

          {/* Notifications button with popover */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors duration-150 relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl" data-icon="notifications">
              notifications
            </span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surface-container-low border border-outline-variant rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant mb-2">
                <span className="text-label-md font-semibold text-on-surface">System Alerts & Incidents</span>
                <span className="text-label-sm px-1.5 py-0.5 rounded bg-error-container/40 text-error font-mono font-bold">
                  1 Critical
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="p-2 rounded-lg bg-error-container/20 border border-error/40 text-body-sm">
                  <div className="flex items-center justify-between text-error font-semibold text-xs">
                    <span>Sponsor Showcase</span>
                    <span className="font-mono">12s ago</span>
                  </div>
                  <p className="text-outline text-xs mt-1">HTTP 502 Bad Gateway: Upstream Nginx connection failed.</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container border border-outline-variant text-body-sm">
                  <div className="flex items-center justify-between text-primary font-semibold text-xs">
                    <span>Schedule & Keynotes</span>
                    <span className="font-mono">18m ago</span>
                  </div>
                  <p className="text-outline text-xs mt-1">Diff detected: +42 words added, -12 words removed.</p>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-outline-variant text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-primary hover:underline text-xs font-semibold"
                >
                  Close Tray
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-outline-variant hidden sm:block"></div>

        {/* Trailing Primary Action: + Add Website (with cyan glow) */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-container text-on-primary-container font-label-lg font-bold hover:bg-primary transition-all duration-200 glow-cyan active:scale-95 shadow-sm text-xs sm:text-sm"
        >
          <span className="material-symbols-outlined text-base sm:text-lg" data-icon="add">
            add
          </span>
          <span>Add Website</span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer group" title="SRE Tech Lead">
          <div className="w-8 h-8 rounded-full border border-primary/50 overflow-hidden ring-1 ring-primary/20 group-hover:border-primary transition-colors">
            <img
              alt="User profile avatar"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
