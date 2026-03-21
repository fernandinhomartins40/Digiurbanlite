import axios from 'axios';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../config/logger.config';
import { prisma } from '../lib/prisma';
import { emailSenderService } from './EmailSenderService';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

type EmailHealthStatus = 'idle' | 'healthy' | 'degraded' | 'unhealthy' | 'disabled';

interface EmailHealthSnapshot {
  status: EmailHealthStatus;
  lastCheckedAt: string | null;
  lastHealthyAt: string | null;
  lastRecoveryAttemptAt: string | null;
  lastRecoverySuccessAt: string | null;
  lastError: string | null;
  lastRecoveryError: string | null;
  consecutiveFailures: number;
  recoveryConfigured: boolean;
  recoveryInProgress: boolean;
  source: string | null;
  details: {
    emailServerId: string | null;
    hostname: string | null;
    port: number | null;
    subscriptionStatus: string | null;
    smtpReachable: boolean;
    staleQueueCount: number;
    recentFailedCount: number;
    recentSentCount: number;
    failureRate: number;
    notes: string[];
  };
}

interface HealthCheckOptions {
  triggerRecovery?: boolean;
  source?: string;
}

interface RecoveryResult {
  triggered: boolean;
  method: string | null;
  message: string;
}

export class EmailServerHealthService {
  private snapshot: EmailHealthSnapshot = {
    status: 'idle',
    lastCheckedAt: null,
    lastHealthyAt: null,
    lastRecoveryAttemptAt: null,
    lastRecoverySuccessAt: null,
    lastError: null,
    lastRecoveryError: null,
    consecutiveFailures: 0,
    recoveryConfigured: false,
    recoveryInProgress: false,
    source: null,
    details: {
      emailServerId: null,
      hostname: null,
      port: null,
      subscriptionStatus: null,
      smtpReachable: false,
      staleQueueCount: 0,
      recentFailedCount: 0,
      recentSentCount: 0,
      failureRate: 0,
      notes: []
    }
  };

  private readonly staleQueueAgeMinutes = parseInt(
    process.env.EMAIL_SERVER_MONITOR_STALE_QUEUE_MINUTES || '10',
    10
  );
  private readonly maxStaleQueue = parseInt(
    process.env.EMAIL_SERVER_MONITOR_MAX_STALE_QUEUE || '10',
    10
  );
  private readonly recentWindowMinutes = parseInt(
    process.env.EMAIL_SERVER_MONITOR_RECENT_WINDOW_MINUTES || '15',
    10
  );
  private readonly maxFailureRate = parseFloat(
    process.env.EMAIL_SERVER_MONITOR_MAX_FAILURE_RATE || '0.35'
  );
  private readonly recoveryFailureThreshold = parseInt(
    process.env.EMAIL_SERVER_MONITOR_FAILURES_BEFORE_RECOVERY || '2',
    10
  );
  private readonly recoveryCooldownMs = parseInt(
    process.env.EMAIL_SERVER_MONITOR_RECOVERY_COOLDOWN_MS || '300000',
    10
  );
  private readonly recoveryTimeoutMs = parseInt(
    process.env.EMAIL_SERVER_MONITOR_RECOVERY_TIMEOUT_MS || '30000',
    10
  );
  private readonly postRecoveryWaitMs = parseInt(
    process.env.EMAIL_SERVER_MONITOR_POST_RECOVERY_WAIT_MS || '12000',
    10
  );

  getStatus(): EmailHealthSnapshot {
    return JSON.parse(JSON.stringify(this.snapshot)) as EmailHealthSnapshot;
  }

  private isRecoveryConfigured(): boolean {
    return Boolean(
      process.env.EMAIL_SERVER_RESTART_URL ||
        process.env.EMAIL_SERVER_RESTART_COMMAND ||
        process.env.EMAIL_SERVER_ENABLE_DOCKER_RESTART === 'true'
    );
  }

  private async writeMonitorLog(
    emailServerId: string | null,
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    metadata?: Record<string, unknown>
  ) {
    if (!emailServerId) {
      return;
    }

    await prisma.emailLog
      .create({
        data: {
          emailServerId,
          status: this.snapshot.status.toUpperCase(),
          type: 'monitor',
          level,
          message,
          metadata: metadata as any
        }
      })
      .catch((error) => {
        logger.warn('Falha ao registrar log do monitor de email', { error });
      });
  }

  private async runRecovery(reason: string): Promise<RecoveryResult> {
    const now = new Date();
    const lastAttempt = this.snapshot.lastRecoveryAttemptAt
      ? new Date(this.snapshot.lastRecoveryAttemptAt)
      : null;

    if (
      lastAttempt &&
      now.getTime() - lastAttempt.getTime() < this.recoveryCooldownMs
    ) {
      return {
        triggered: false,
        method: null,
        message: 'Recuperação em cooldown'
      };
    }

    const restartUrl = process.env.EMAIL_SERVER_RESTART_URL;
    const restartCommand = process.env.EMAIL_SERVER_RESTART_COMMAND;
    const dockerEnabled = process.env.EMAIL_SERVER_ENABLE_DOCKER_RESTART === 'true';
    const dockerContainer =
      process.env.EMAIL_SERVER_DOCKER_CONTAINER || 'ultrazend-smtp';

    if (!restartUrl && !restartCommand && !dockerEnabled) {
      return {
        triggered: false,
        method: null,
        message: 'Recuperação automática não configurada'
      };
    }

    this.snapshot.recoveryInProgress = true;
    this.snapshot.lastRecoveryAttemptAt = now.toISOString();
    this.snapshot.lastRecoveryError = null;

    try {
      let method: string;

      if (restartUrl) {
        const token = process.env.EMAIL_SERVER_RESTART_BEARER_TOKEN;
        await axios.post(
          restartUrl,
          {
            reason,
            source: 'email-server-monitor',
            requestedAt: now.toISOString()
          },
          {
            timeout: this.recoveryTimeoutMs,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`
                }
              : undefined
          }
        );
        method = 'url';
      } else if (restartCommand) {
        await execAsync(restartCommand, {
          timeout: this.recoveryTimeoutMs,
          windowsHide: true
        });
        method = 'command';
      } else {
        await execFileAsync('docker', ['restart', dockerContainer], {
          timeout: this.recoveryTimeoutMs,
          windowsHide: true
        });
        method = 'docker';
      }

      this.snapshot.lastRecoverySuccessAt = new Date().toISOString();

      await this.writeMonitorLog(
        this.snapshot.details.emailServerId,
        'WARN',
        'Recuperação automática do servidor de email acionada',
        {
          reason,
          method
        }
      );

      return {
        triggered: true,
        method,
        message: 'Recuperação automática acionada'
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Falha desconhecida na recuperação';
      this.snapshot.lastRecoveryError = errorMessage;

      await this.writeMonitorLog(
        this.snapshot.details.emailServerId,
        'ERROR',
        'Falha ao tentar recuperar o servidor de email',
        {
          reason,
          error: errorMessage
        }
      );

      return {
        triggered: false,
        method: null,
        message: errorMessage
      };
    } finally {
      this.snapshot.recoveryInProgress = false;
    }
  }

  async triggerRecovery(reason: string): Promise<RecoveryResult> {
    return this.runRecovery(reason);
  }

  async checkHealth(options: HealthCheckOptions = {}): Promise<EmailHealthSnapshot> {
    const triggerRecovery = options.triggerRecovery ?? false;
    const source = options.source || 'manual';
    const now = new Date();
    const previousStatus = this.snapshot.status;
    const recoveryConfigured = this.isRecoveryConfigured();

    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            planConfig: true
          }
        }
      }
    });

    if (!emailServer) {
      this.snapshot = {
        ...this.snapshot,
        status: 'disabled',
        lastCheckedAt: now.toISOString(),
        lastError: 'Servidor de email não configurado',
        recoveryConfigured,
        source,
        details: {
          emailServerId: null,
          hostname: null,
          port: null,
          subscriptionStatus: null,
          smtpReachable: false,
          staleQueueCount: 0,
          recentFailedCount: 0,
          recentSentCount: 0,
          failureRate: 0,
          notes: ['Servidor de email não configurado']
        }
      };

      return this.getStatus();
    }

    const windowStart = new Date(
      now.getTime() - this.recentWindowMinutes * 60 * 1000
    );
    const staleQueueThreshold = new Date(
      now.getTime() - this.staleQueueAgeMinutes * 60 * 1000
    );

    const [staleQueueCount, recentFailedCount, recentSentCount] =
      await Promise.all([
        prisma.email.count({
          where: {
            emailServerId: emailServer.id,
            status: 'QUEUED',
            createdAt: {
              lte: staleQueueThreshold
            }
          }
        }),
        prisma.email.count({
          where: {
            emailServerId: emailServer.id,
            status: 'FAILED',
            failedAt: {
              gte: windowStart
            }
          }
        }),
        prisma.email.count({
          where: {
            emailServerId: emailServer.id,
            status: {
              in: ['SENT', 'DELIVERED']
            },
            sentAt: {
              gte: windowStart
            }
          }
        })
      ]);

    const notes: string[] = [];
    const failureRate =
      recentFailedCount + recentSentCount > 0
        ? recentFailedCount / (recentFailedCount + recentSentCount)
        : 0;

    let smtpReachable = false;
    let currentStatus: EmailHealthStatus = 'healthy';
    let currentError: string | null = null;

    const subscriptionStatus = emailServer.subscription?.status || null;
    const activeSubscription =
      subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL';

    if (!activeSubscription) {
      currentStatus = 'disabled';
      notes.push('Assinatura de email não está ativa');
    }

    if (!emailServer.isActive) {
      currentStatus = activeSubscription ? 'unhealthy' : 'disabled';
      notes.push('Servidor de email está marcado como inativo');
    }

    if (activeSubscription && emailServer.isActive) {
      try {
        await emailSenderService.verifyConnection({
          hostname: emailServer.hostname,
          port: emailServer.submissionPort
        });
        smtpReachable = true;
      } catch (error) {
        currentStatus = 'unhealthy';
        currentError =
          error instanceof Error ? error.message : 'Falha ao validar conexão SMTP';
        notes.push(`Falha na conexão SMTP: ${currentError}`);
      }
    }

    if (smtpReachable && currentStatus === 'healthy') {
      if (staleQueueCount > this.maxStaleQueue) {
        currentStatus = 'degraded';
        notes.push(
          `${staleQueueCount} emails estão presos na fila há mais de ${this.staleQueueAgeMinutes} minutos`
        );
      }

      if (failureRate >= this.maxFailureRate) {
        currentStatus = 'degraded';
        notes.push(
          `Taxa de falha recente em ${(failureRate * 100).toFixed(1)}%`
        );
      }
    }

    const consecutiveFailures =
      currentStatus === 'healthy' ? 0 : this.snapshot.consecutiveFailures + 1;

    this.snapshot = {
      ...this.snapshot,
      status: currentStatus,
      lastCheckedAt: now.toISOString(),
      lastHealthyAt:
        currentStatus === 'healthy'
          ? now.toISOString()
          : this.snapshot.lastHealthyAt,
      lastError: currentError,
      consecutiveFailures,
      recoveryConfigured,
      source,
      details: {
        emailServerId: emailServer.id,
        hostname: emailServer.hostname,
        port: emailServer.submissionPort,
        subscriptionStatus,
        smtpReachable,
        staleQueueCount,
        recentFailedCount,
        recentSentCount,
        failureRate,
        notes
      }
    };

    if (
      previousStatus !== currentStatus ||
      currentStatus === 'degraded' ||
      currentStatus === 'unhealthy'
    ) {
      await this.writeMonitorLog(
        emailServer.id,
        currentStatus === 'healthy'
          ? 'INFO'
          : currentStatus === 'degraded'
          ? 'WARN'
          : 'ERROR',
        'Status do servidor de email atualizado',
        {
          source,
          status: currentStatus,
          notes,
          smtpReachable,
          staleQueueCount,
          recentFailedCount,
          recentSentCount,
          failureRate
        }
      );
    }

    if (
      triggerRecovery &&
      recoveryConfigured &&
      !this.snapshot.recoveryInProgress &&
      activeSubscription &&
      (currentStatus === 'unhealthy' ||
        (currentStatus === 'degraded' &&
          (staleQueueCount > this.maxStaleQueue * 2 ||
            failureRate >= Math.min(this.maxFailureRate + 0.15, 0.95)))) &&
      consecutiveFailures >= this.recoveryFailureThreshold
    ) {
      const recoveryResult = await this.runRecovery(
        notes[0] || 'Monitor detectou degradação do servidor de email'
      );

      if (recoveryResult.triggered) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.postRecoveryWaitMs)
        );
        return this.checkHealth({
          triggerRecovery: false,
          source: 'post-recovery'
        });
      }
    }

    return this.getStatus();
  }
}

export const emailServerHealthService = new EmailServerHealthService();
