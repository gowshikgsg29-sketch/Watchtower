import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Sliders,
  ShieldCheck,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Mail,
  MessageSquare,
  Globe,
  Loader2,
} from 'lucide-react';
import { NotificationSettings } from '../types/monitor';

interface SettingsProps {
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => Promise<void>;
  onTestNotification: (channel: 'telegram' | 'slack' | 'discord' | 'email') => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onTestNotification,
}) => {
  const [form, setForm] = useState<NotificationSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (channel: 'telegram' | 'slack' | 'discord' | 'email') => {
    setTestingChannel(channel);
    try {
      await onTestNotification(channel);
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <div className="space-y-gutter-md animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              System Settings & Alerts
            </h1>
            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-surface-container-high text-primary border border-outline-variant font-mono">
              Telemetry Config
            </span>
          </div>
          <p className="text-body-md text-outline mt-1">
            Configure default crawler behavior, noise suppression filters, and instant notification dispatchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tertiary-container/30 text-tertiary text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration Persisted</span>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-gutter">
        {/* SECTION 1: CRAWLER & PLAYWRIGHT EXECUTION POLICY */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-headline-sm font-semibold text-on-surface text-base">
              Crawler & Automation Engine (Playwright Defaults)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Default Check Frequency
              </label>
              <select
                value={form.defaultCheckInterval}
                onChange={(e) => setForm({ ...form, defaultCheckInterval: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Every 1 minute">Every 1 minute (Aggressive)</option>
                <option value="Every 5 minutes">Every 5 minutes (Standard Recommended)</option>
                <option value="Every 10 minutes">Every 10 minutes</option>
                <option value="Every 30 minutes">Every 30 minutes</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Request Timeout (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={form.requestTimeoutSeconds}
                onChange={(e) =>
                  setForm({ ...form, requestTimeoutSeconds: parseInt(e.target.value) || 15 })
                }
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Custom User-Agent Header
              </label>
              <input
                type="text"
                value={form.userAgent}
                onChange={(e) => setForm({ ...form, userAgent: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-outline mt-1 block">
                Public website administrators will observe this User-Agent in access logs.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: NOISE SUPPRESSION & DOM NORMALIZATION */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
            <ShieldCheck className="w-5 h-5 text-tertiary" />
            <h2 className="text-headline-sm font-semibold text-on-surface text-base">
              Intelligent Noise Reduction & DOM Sanitization
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant cursor-pointer">
              <input
                type="checkbox"
                checked={form.ignoreTimestamps}
                onChange={(e) => setForm({ ...form, ignoreTimestamps: e.target.checked })}
                className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  Filter Changing Timestamps & Live Clocks
                </span>
                <span className="text-xs text-outline">
                  Automatically ignores dynamic date patterns like "Last updated 2 mins ago" or copyright years to prevent false diffs.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant cursor-pointer">
              <input
                type="checkbox"
                checked={form.ignoreRandomTokens}
                onChange={(e) => setForm({ ...form, ignoreRandomTokens: e.target.checked })}
                className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  Strip Ephemeral CSRF & Session Nonces
                </span>
                <span className="text-xs text-outline">
                  Strips hidden form tokens, session hashes, and random nonces embedded in HTML responses.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant cursor-pointer">
              <input
                type="checkbox"
                checked={form.ignoreTrackingScripts}
                onChange={(e) => setForm({ ...form, ignoreTrackingScripts: e.target.checked })}
                className="rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  Prune Tracking & Analytics Injections
                </span>
                <span className="text-xs text-outline">
                  Removes dynamic telemetry payloads injected by Google Tag Manager, Cloudflare Insights, and hotjar scripts.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 3: NOTIFICATION WEBHOOKS & TELEMETRY DISPATCH */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-space-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
            <Bell className="w-5 h-5 text-secondary" />
            <h2 className="text-headline-sm font-semibold text-on-surface text-base">
              Alert Notification Webhooks & Incident Dispatch
            </h2>
          </div>

          <div className="space-y-4">
            {/* Telegram */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs text-on-surface">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>Telegram Bot Integration</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTest('telegram')}
                  disabled={testingChannel === 'telegram'}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs border border-outline-variant transition-colors flex items-center gap-1"
                >
                  {testingChannel === 'telegram' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Telegram Ping</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-outline block mb-1">Bot API Token</label>
                  <input
                    type="password"
                    value={form.telegramBotToken}
                    onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-outline block mb-1">Target Chat / Channel ID</label>
                  <input
                    type="text"
                    value={form.telegramChatId}
                    onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Slack */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs text-on-surface">
                  <MessageSquare className="w-4 h-4 text-tertiary" />
                  <span>Slack Incoming Webhook URL</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTest('slack')}
                  disabled={testingChannel === 'slack'}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-semibold text-xs border border-outline-variant transition-colors flex items-center gap-1"
                >
                  {testingChannel === 'slack' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Slack Ping</span>
                </button>
              </div>

              <input
                type="text"
                value={form.slackWebhook}
                onChange={(e) => setForm({ ...form, slackWebhook: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
              />
            </div>

            {/* Discord */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs text-on-surface">
                  <MessageSquare className="w-4 h-4 text-secondary" />
                  <span>Discord Webhook URL</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTest('discord')}
                  disabled={testingChannel === 'discord'}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-secondary font-semibold text-xs border border-outline-variant transition-colors flex items-center gap-1"
                >
                  {testingChannel === 'discord' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Discord Ping</span>
                </button>
              </div>

              <input
                type="text"
                value={form.discordWebhook}
                onChange={(e) => setForm({ ...form, discordWebhook: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
              />
            </div>

            {/* Email */}
            <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs text-on-surface">
                  <Mail className="w-4 h-4 text-error" />
                  <span>Email Recipient List (comma separated)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTest('email')}
                  disabled={testingChannel === 'email'}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-error font-semibold text-xs border border-outline-variant transition-colors flex items-center gap-1"
                >
                  {testingChannel === 'email' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Email Dispatch</span>
                </button>
              </div>

              <input
                type="text"
                value={form.emailRecipients}
                onChange={(e) => setForm({ ...form, emailRecipients: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-lg font-bold hover:bg-primary transition-all glow-cyan active:scale-95 shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Telemetry Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
