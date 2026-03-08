import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const adminAppDir = path.join(repoRoot, 'digiurban', 'frontend', 'app', 'admin');
const outputPath = path.join(
  repoRoot,
  'digiurban-ai',
  'src',
  'generated',
  'admin-routes.generated.json',
);

function humanizeSegment(segment) {
  const normalized = segment
    .replace(/^\[(.+)\]$/, '$1')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .trim();

  if (!normalized) {
    return 'Admin';
  }

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferCategory(segments) {
  const firstSegment = segments[0] || 'admin';
  return humanizeSegment(firstSegment);
}

function buildKeywords(routePath, segments) {
  const rawTerms = new Set([
    'digiurban',
    'admin',
    ...routePath.split('/'),
    ...segments.flatMap((segment) => segment.replace(/[\[\]-]/g, ' ').split(/\s+/)),
  ]);

  return Array.from(rawTerms)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 2);
}

function collectRoutes(currentDir, results) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const hasPage = entries.some((entry) => entry.isFile() && entry.name === 'page.tsx');

  if (hasPage) {
    const relativeDir = path.relative(adminAppDir, currentDir);
    const normalizedRelative = relativeDir === '' ? '' : relativeDir.split(path.sep).join('/');
    const segments = normalizedRelative ? normalizedRelative.split('/').filter(Boolean) : [];
    const routePath = segments.length ? `/admin/${segments.join('/')}` : '/admin';
    const lastSegment = segments[segments.length - 1] || 'admin';

    results.push({
      id: routePath.replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '') || 'admin',
      title: routePath === '/admin' ? 'Portal Administrativo' : humanizeSegment(lastSegment),
      path: routePath,
      category: inferCategory(segments),
      summary:
        routePath === '/admin'
          ? 'Tela inicial do portal administrativo da DigiUrban.'
          : `Tela administrativa disponivel em ${routePath}.`,
      keywords: buildKeywords(routePath, segments),
      sourcePath: `digiurban/frontend/app/admin/${normalizedRelative ? `${normalizedRelative}/` : ''}page.tsx`,
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === 'api' || entry.name.startsWith('_')) {
      continue;
    }

    collectRoutes(path.join(currentDir, entry.name), results);
  }
}

function main() {
  if (!fs.existsSync(adminAppDir)) {
    throw new Error(`Admin app directory not found: ${adminAppDir}`);
  }

  const routes = [];
  collectRoutes(adminAppDir, routes);
  routes.sort((a, b) => a.path.localeCompare(b.path));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2) + '\n', 'utf8');

  console.log(`Generated ${routes.length} admin routes at ${outputPath}`);
}

main();
