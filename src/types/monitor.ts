export type MonitorStatus = 'healthy' | 'alert' | 'paused' | 'checking';

export interface MonitoredWebsite {
  id: string;
  name: string;
  url: string;
  code: string;
  status: MonitorStatus;
  httpStatus: number;
  statusMessage: string;
  checkInterval: string;
  checkIntervalMinutes: number;
  lastChecked: string;
  lastCheckedTime: string;
  lastChanged: string;
  lastChangedTime: string;
  selectorMode: 'Full Page DOM' | 'CSS Selector #content' | 'Visual Screenshot Diff' | 'Raw Markdown';
  cssSelector?: string;
  alertChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  uptimePercent: number;
  avgResponseMs: number;
  changeCount: number;
  lastError?: string;
  cluster?: string;
}

export interface WebsiteSnapshot {
  id: string;
  websiteId: string;
  timestamp: string;
  versionTag: string;
  textContent: string;
  wordCount: number;
  httpStatus: number;
  responseMs: number;
  hasChanges: boolean;
  changeSummary?: string;
}

export interface ChangeRecord {
  id: string;
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  timestamp: string;
  timeAgo: string;
  wordsAdded: number;
  wordsRemoved: number;
  changeType: 'dom' | 'text' | 'visual' | 'git' | 'status_error';
  summary: string;
  selector: string;
  visualMatchPercent?: number;
  oldSnapshotId: string;
  newSnapshotId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationSettings {
  defaultCheckInterval: string;
  requestTimeoutSeconds: number;
  userAgent: string;
  slackWebhook: string;
  discordWebhook: string;
  telegramBotToken: string;
  telegramChatId: string;
  emailRecipients: string;
  ignoreTimestamps: boolean;
  ignoreRandomTokens: boolean;
  ignoreTrackingScripts: boolean;
  maxRetries: number;
  sendTelegramAlerts: boolean;
  sendSlackAlerts: boolean;
  sendDiscordAlerts: boolean;
  sendEmailAlerts: boolean;
}

export interface SystemStats {
  totalWebsites: number;
  totalWebsitesDelta: string;
  changesDetected: number;
  changesDetectedDelta: string;
  healthyWebsites: number;
  healthyWebsitesPercent: string;
  uptimeSla: string;
  monitoringErrors: number;
  errorDescription: string;
  poolCapacityPercent: number;
  domMutationsCount: number;
  hostsPinging: number;
  avgPingMs: number;
}
