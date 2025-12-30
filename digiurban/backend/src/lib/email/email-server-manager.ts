import { UltraZendSMTPServer } from './UltraZendAdapter';
import { prisma } from '../prisma';

type EmailServerRuntime = {
  instance: UltraZendSMTPServer;
  emailServerId: string;
};

let runtime: EmailServerRuntime | null = null;

async function getEmailServerRecord() {
  return prisma.emailServer.findFirst({
    orderBy: { createdAt: 'desc' }
  });
}

export async function startEmailServer() {
  const emailServer = await getEmailServerRecord();
  if (!emailServer) {
    throw new Error('Email server not configured');
  }

  if (!runtime || runtime.emailServerId !== emailServer.id) {
    if (runtime) {
      await runtime.instance.stop();
    }

    runtime = {
      emailServerId: emailServer.id,
      instance: new UltraZendSMTPServer({
        emailServerId: emailServer.id,
        hostname: emailServer.hostname,
        mxPort: emailServer.mxPort,
        submissionPort: emailServer.submissionPort,
        maxConnections: 100,
        tlsEnabled: emailServer.tlsEnabled,
        certPath: emailServer.certPath || undefined,
        keyPath: emailServer.keyPath || undefined
      })
    };
  }

  await runtime.instance.start();
  return runtime.instance.getRuntimeStatus();
}

export async function stopEmailServer() {
  if (!runtime) {
    return { isRunning: false, uptime: 0, connections: { active: 0, total: 0 } };
  }

  await runtime.instance.stop();
  const status = runtime.instance.getRuntimeStatus();
  runtime = null;
  return status;
}

export function getEmailServerRuntimeStatus() {
  return runtime?.instance.getRuntimeStatus() ?? null;
}
