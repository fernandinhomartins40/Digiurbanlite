import { runEmailServerHealthCheckOnce } from '../jobs/email-server-monitor';
import { prisma } from '../lib/prisma';

async function main() {
  const snapshot = await runEmailServerHealthCheckOnce();
  console.log(JSON.stringify(snapshot, null, 2));
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Falha ao executar health check do servidor de email:', error);
    prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
