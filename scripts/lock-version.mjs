#!/usr/bin/env node
/**
 * Resolve the exact version of a package as pinned in pnpm-lock.yaml.
 *
 * Why this exists: the Dockerfile `migration` stage installs the Prisma CLI
 * standalone. If it were given the range from package.json (`^7.8.0`) it could
 * resolve to a newer CLI than the one that generated the app's client, and
 * `migrate deploy` would then apply migrations with a different engine version
 * than the app expects. Pinning to the lockfile removes that drift.
 *
 * Usage:  node scripts/lock-version.mjs prisma
 * Output: 7.8.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = process.argv[2];
if (!pkg) {
  console.error('usage: node scripts/lock-version.mjs <package-name>');
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const lockPath = path.join(here, '..', 'pnpm-lock.yaml');
const lock = fs.readFileSync(lockPath, 'utf8');

// Only the `importers: .:` block describes what THIS project depends on.
// Later blocks (`packages:` / `snapshots:`) also contain `<name>@<version>:`
// keys, including transitive copies at other versions.
const importersEnd = lock.search(/^packages:\s*$/m);
const importerBlock = lock.slice(0, importersEnd === -1 ? lock.length : importersEnd);

// Entry shape inside `importers: .:` -> devDependencies/dependencies:
//     dotenv:
//       specifier: ^17.4.2
//       version: 17.4.2
// Quoted names such as '@prisma/client' are supported.
const name = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const entryRe = new RegExp(
  String.raw`^\s{6}(?:${name}|'${name}'|"${name}"):\s*$` +
    String.raw`\s*\n\s*specifier:[^\n]*` +
    String.raw`\s*\n\s*version:\s*(\S+)`,
  'm',
);

const match = importerBlock.match(entryRe);
if (!match) {
  console.error(`Could not resolve "${pkg}" in the importers block of pnpm-lock.yaml.`);
  process.exit(1);
}

// Resolved values carry pnpm peer-dependency suffixes, e.g.
//   7.8.0(@types/react@19.2.17)(react-dom@2.7.0)(typescript@5.9.3)
// Strip everything from the first '(' to get the bare semver.
const version = match[1].split('(')[0].trim();

if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Unexpected resolved version for "${pkg}": ${version}`);
  process.exit(1);
}

process.stdout.write(`${version}\n`);
