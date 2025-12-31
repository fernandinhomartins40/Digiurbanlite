/**
 * Types for Email Server Management
 */

export interface EmailServer {
  id: string;
  hostname: string;
  mxPort: number;
  submissionPort: number;
  isActive: boolean;
  isPremiumService: boolean;
  monthlyPrice: number;
  maxEmailsPerMonth: number;
  tlsEnabled: boolean;
  certPath?: string;
  keyPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailServerConfig {
  hostname: string;
  mxPort: number;
  submissionPort: number;
  maxConnections: number;
  maxMessageSize: number;
  tlsEnabled: boolean;
  certPath?: string;
  keyPath?: string;
  authRequired: boolean;
  isPremiumService: boolean;
  monthlyPrice: number;
  maxEmailsPerMonth: number;
}

export interface EmailServerStatus {
  isRunning: boolean;
  uptime: number;
  hostname: string;
  ports: {
    mx: number;
    submission: number;
  };
  stats: {
    totalEmails: number;
    deliveredEmails: number;
    failedEmails: number;
    queuedEmails: number;
    deliveryRate: string;
  };
  connections: {
    active: number;
    total: number;
  };
}

export interface EmailDomain {
  id: string;
  emailServerId: string;
  domainName: string;
  isVerified: boolean;
  verificationToken?: string;
  dkimEnabled: boolean;
  dkimSelector: string;
  dkimPrivateKey?: string;
  dkimPublicKey?: string;
  spfEnabled: boolean;
  spfRecord?: string;
  dmarcEnabled: boolean;
  dmarcPolicy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DNSRecord {
  type: 'MX' | 'A' | 'TXT' | 'CNAME';
  name: string;
  value: string;
  priority?: number;
  status: 'pending' | 'verified' | 'error';
  errorMessage?: string;
  description?: string;
}

export interface DKIMKeyPair {
  selector: string;
  privateKey: string;
  publicKey: string;
  dnsRecord: string;
}

export interface EmailServerLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface DomainStats {
  domainName: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  opensCount: number;
  clicksCount: number;
  openRate: number;
  clickRate: number;
  lastEmailSent?: string;
}

export interface DNSVerificationResult {
  recordType: 'MX' | 'SPF' | 'DKIM' | 'DMARC';
  verified: boolean;
  found: boolean;
  expected: string;
  actual?: string;
  errorMessage?: string;
}

export interface TestEmailRequest {
  domainId: string;
  to: string;
  subject: string;
  body: string;
}

export interface EmailUser {
  id: string;
  emailServerId: string;
  email: string;
  name: string;
  isActive: boolean;
  isAdmin: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  sentToday: number;
  sentThisMonth: number;
  lastLoginAt?: string;
  createdAt: string;
}
