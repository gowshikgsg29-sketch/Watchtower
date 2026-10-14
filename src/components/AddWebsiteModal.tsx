import React, { useState } from 'react';
import { X, Loader2, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { MonitoredWebsite } from '../types/monitor';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    url: string;
    checkInterval: string;
    selectorMode: 'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown';
    cssSelector?: string;
    alertChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  }) => Promise<void>;
}

export const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [checkInterval, setCheckInterval] = useState('Every 5 minutes');
  const [selectorMode, setSelectorMode] = useState<
    'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown'
  >('CSS Selector #content');
  const [cssSelector, setCssSelector] = useState('#content');
  const [alertChannels, setAlertChannels] = useState<
    ('slack' | 'discord' | 'email' | 'telegram')[]
  >(['slack', 'discord']);

  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { name?: string; url?: string } = {};

    if (!name.trim()) {
      errs.name = 'Please provide a target website name.';
    }

    if (!url.trim()) {
      errs.url = 'Target URL endpoint is required.';
    } else {
      let formatted = url.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = 'https://' + formatted;
      }
      try {
        const parsed = new URL(formatted);
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
          errs.url = 'Please provide a valid domain (e.g. club.edu or domain.com).';
        }
      } catch {
        errs.url = 'Invalid URL format. Please enter a valid HTTP/HTTPS address.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        url: cleanUrl,
        checkInterval,
        selectorMode,
        cssSelector: selectorMode === 'CSS Selector #content' ? cssSelector : undefined,
        alertChannels,
      });
      // Reset form
      setName('');
      setUrl('');
      setErrors({});
      onClose();
    } catch (err: any) {
      console.error('Add target error:', err);
      setErrors({ url: err?.message || 'Failed to enroll target endpoint.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channel: 'slack' | 'discord' | 'email' | 'telegram') => {
    if (alertChannels.includes(channel)) {
      setAlertChannels(alertChannels.filter((c) => c !== channel));
    } else {
      setAlertChannels([...alertChannels, channel]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high text-primary border border-outline-variant flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl" data-icon="add_circle">
                add_circle
              </span>
            </div>
            <div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
                New Monitor Target
              </h3>
              <p className="text-body-sm font-body-sm text-outline">
                Register URL for automated DOM diff and ping telemetry.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
            onClick={onClose}
            title="Close dialog"
          >
            <span className="material-symbols-outlined text-xl" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Target Name */}
          <div>
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
              Target Name <span className="text-error">*</span>
            </label>
            <input
              className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all ${
                errors.name
                  ? 'border-error focus:border-error focus:ring-error/40'
                  : 'border-outline-variant focus:border-primary focus:ring-primary'
              }`}
              placeholder="e.g. ACM Portal & Events"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Full URL Endpoint */}
          <div>
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
              Full URL Endpoint <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                className={`w-full bg-surface-container-lowest border rounded-lg pl-9 pr-3 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all ${
                  errors.url
                    ? 'border-error focus:border-error focus:ring-error/40'
                    : 'border-outline-variant focus:border-primary focus:ring-primary'
                }`}
                placeholder="https://club.edu/events"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.url) setErrors({ ...errors, url: undefined });
                }}
              />
              <span
                className="material-symbols-outlined text-outline absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                data-icon="lock"
              >
                lock
              </span>
            </div>
            {errors.url && (
              <p className="text-error text-xs mt-1 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.url}</span>
              </p>
            )}
          </div>

          {/* Frequency and Selector Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Check Frequency
              </label>
              <select
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={checkInterval}
                onChange={(e) => setCheckInterval(e.target.value)}
              >
                <option value="Every 1 minute">Every 1 minute (Fast)</option>
                <option value="Every 5 minutes">Every 5 minutes (Standard)</option>
                <option value="Every 10 minutes">Every 10 minutes</option>
                <option value="Every 30 minutes">Every 30 minutes</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Diff Scope / Mode
              </label>
              <select
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={selectorMode}
                onChange={(e) =>
                  setSelectorMode(
                    e.target.value as
                      | 'Full Page DOM'
                      | 'CSS Selector #content'
                      | 'Visual Screenshot Diff'
                      | 'Raw Markdown'
                  )
                }
              >
                <option value="CSS Selector #content">CSS Selector #content</option>
                <option value="Full Page DOM">Full Page DOM</option>
                <option value="Visual Screenshot Diff">Visual Screenshot Diff</option>
                <option value="Raw Markdown">Raw Markdown</option>
              </select>
            </div>
          </div>

          {/* Optional CSS Selector Input */}
          {selectorMode === 'CSS Selector #content' && (
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Custom CSS Selector Target
              </label>
              <input
                type="text"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm font-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="#content, main, .target-area"
                value={cssSelector}
                onChange={(e) => setCssSelector(e.target.value)}
              />
              <span className="text-outline text-xs mt-1 block">
                Limits change detection to elements matching this query selector.
              </span>
            </div>
          )}

          {/* Alert Channels Selection */}
          <div>
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1.5">
              Alert Notification Channels
            </label>
            <div className="flex flex-wrap items-center gap-4 py-1">
              {(['slack', 'discord', 'telegram', 'email'] as const).map((channel) => (
                <label
                  key={channel}
                  className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                    checked={alertChannels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                  />
                  <span className="capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-label-md font-label-md font-semibold transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary text-label-md font-label-md font-bold glow-cyan transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling Target...</span>
                </>
              ) : (
                <span>Confirm & Monitor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
