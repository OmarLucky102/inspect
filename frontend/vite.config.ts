import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

interface DirectTarget {
  specifier: string;
  named?: boolean; // true => import { imported as local }, false => import local
}

type PackageResolver = (imported: string) => DirectTarget | null;

function buildPhosphorResolver(require: NodeRequire): PackageResolver {
  const csrDir = path.join(
    path.dirname(require.resolve('@phosphor-icons/react/package.json')),
    'dist/csr',
  );
  const csrNames = new Set(
    fs
      .readdirSync(csrDir)
      .filter((file) => file.endsWith('.es.js'))
      .map((file) => file.slice(0, -6)),
  );
  const libExports = new Set(['IconContext', 'IconBase', 'SSRBase']);

  return (imported) => {
    if (libExports.has(imported)) {
      return { specifier: '@phosphor-icons/react/lib', named: true };
    }
    const iconFile = csrNames.has(imported)
      ? imported
      : imported.endsWith('Icon') && csrNames.has(imported.slice(0, -4))
        ? imported.slice(0, -4)
        : null;
    return iconFile
      ? { specifier: `@phosphor-icons/react/dist/csr/${iconFile}`, named: true }
      : null;
  };
}

function buildLucideResolver(require: NodeRequire): PackageResolver {
  const pkgDir = path.dirname(require.resolve('lucide-react/package.json'));
  const barrel = fs.readFileSync(
    path.join(pkgDir, 'dist/esm/lucide-react.mjs'),
    'utf8',
  );
  const iconMap = new Map<string, string>();

  for (const match of barrel.matchAll(
    /export\s*\{([^}]+)\}\s*from\s*'\.\/icons\/([^']+)\.mjs'/g,
  )) {
    const [, exportsList, iconSlug] = match;
    for (const part of exportsList.split(',')) {
      const aliasMatch = part.trim().match(/^default\s+as\s+(\w+)$/);
      if (aliasMatch) iconMap.set(aliasMatch[1], iconSlug);
    }
  }

  return (imported) => {
    const slug = iconMap.get(imported);
    return slug
      ? { specifier: `lucide-react/icons/${slug}`, named: false }
      : null;
  };
}

/**
 * Rewrites barrel icon imports (`@phosphor-icons/react`, `lucide-react`) into
 * direct subpath imports after Vite strips TypeScript types. Eliminates
 * transforming ~7,000+ unused icon modules on every build.
 */
function iconBarrelTreeShake(): Plugin {
  const require = createRequire(import.meta.url);
  const resolvers: Record<string, PackageResolver> = {
    '@phosphor-icons/react': buildPhosphorResolver(require),
    'lucide-react': buildLucideResolver(require),
  };
  const importRe =
    /import\s*\{([^}]+)\}\s*from\s*['"](@phosphor-icons\/react|lucide-react)['"]\s*;?/g;

  return {
    name: 'icon-barrel-tree-shake',
    transform(code, id) {
      if (
        id.includes('node_modules') ||
        (!code.includes('@phosphor-icons/react') &&
          !code.includes('lucide-react'))
      ) {
        return null;
      }

      let changed = false;
      const rewritten = code.replace(
        importRe,
        (full, specifiers: string, pkg: string) => {
          const resolve = resolvers[pkg];
          const directImports: string[] = [];
          const fallback: string[] = [];

          for (const raw of specifiers.split(',')) {
            const item = raw.trim();
            if (!item || item.startsWith('type ')) continue;

            const [imported, alias] = item
              .split(/\s+as\s+/)
              .map((s) => s.trim());
            const local = alias || imported;
            const target = resolve(imported);

            if (!target) {
              fallback.push(item);
              continue;
            }

            directImports.push(
              target.named
                ? `import { ${alias ? `${imported} as ${alias}` : imported} } from '${target.specifier}';`
                : `import ${local} from '${target.specifier}';`,
            );
          }

          if (directImports.length === 0) return full;

          changed = true;
          if (fallback.length > 0) {
            directImports.push(
              `import { ${fallback.join(', ')} } from '${pkg}';`,
            );
          }
          return directImports.join('\n');
        },
      );

      return changed ? { code: rewritten, map: null } : null;
    },
  };
}

// Admin panel: Vite + React + Tailwind v4.
// API base comes from VITE_API_URL (see .env). Cookie auth requires
// credentials:include on the client and CORS allowlist on the API.
export default defineConfig({
  plugins: [react(), tailwindcss(), iconBarrelTreeShake()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  optimizeDeps: {
    exclude: ['@phosphor-icons/react', 'lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:18080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        // Declarative Rust-native Rolldown chunk groups (replaces deprecated manualChunks if-chains).
        codeSplitting: {
          groups: [
            {
              name: 'vendor-icons',
              test: /node_modules[\\/](@phosphor-icons|lucide-react)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-router',
              test: /node_modules[\\/]react-router/,
              priority: 15,
            },
            {
              name: 'vendor-query',
              test: /node_modules[\\/](@tanstack[\\/]react-query|axios)[\\/]/,
              priority: 15,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](recharts|d3-|victory-)/,
              priority: 15,
            },
            {
              name: 'vendor-i18n',
              test: /node_modules[\\/](i18next|react-i18next)[\\/]/,
              priority: 15,
            },
            {
              name: 'vendor-ui-primitives',
              test: /node_modules[\\/](@radix-ui|react-hook-form|@hookform|zod)[\\/]/,
              priority: 15,
            },
            { name: 'vendor-misc', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
});
