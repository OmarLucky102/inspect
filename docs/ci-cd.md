# ==============================================================================
# inspect-api CI/CD
# ==============================================================================
> Everything below reflects what is actually implemented in `.github/workflows/`
> and `scripts/`. Where a control is *not* yet active it says so explicitly.

## 1. Architecture at a glance

```text
PR (any branch -> master)
  ├─ _quality.yml    prettier -> eslint -> tsc --noEmit -> build
  │                  unit tests + coverage -> e2e (postgres:17 service)
  │                  bash tests for scripts/lib.sh
  └─ _security.yml   gitleaks -> CodeQL -> pnpm audit -> trivy config

push to master
  ├─ _quality.yml / _security.yml         (same gates as PR)
  ├─ _build-image.yml
  │     build app image        (target: production)  ── built ONCE ──┐
  │     build migration image  (target: migration)                 │
  │     push both as :sha-<commit> + :untested-<commit>            │
  │     scan both by digest      <- gate: CRITICAL blocks           │
  │     sign both by digest      (cosign keyless / OIDC)            │
  │     promote :latest + :migration-latest  <- only after the gate │
  └─ _deploy.yml  staging
        migrate -> pull -> up --wait -> external smoke -> ZAP DAST
  └─ _deploy.yml  production        [manual approval]
        migrate -> pull -> up --wait -> external smoke
        failure after switchover => scripts/deploy.sh auto-rolls-back

tag v1.2.3
  └─ same as master + semver tag + GitHub Release
```

The single most important property: **the artifact is built exactly once.**
Staging and production receive the same digest. Nothing is recompiled between
environments, so what was scanned is what runs.

## 2. Files added

```text
.github/workflows/
  pr.yml             PR entry point (quality + security only)
  main.yml           master -> staging -> production
  release.yml        v* tag -> staging -> production -> GitHub Release
  _quality.yml       reusable: lint / format / typecheck / build / unit / e2e
  _security.yml      reusable: secrets / SAST / SCA / IaC
  _build-image.yml   reusable: build once -> scan -> sign -> promote
  _deploy.yml        reusable: SSH deploy + migrate + smoke + DAST
.github/dependabot.yml

docker-compose.prod.yml   self-contained prod/staging stack (no build, digest-pinned)
scripts/
  lib.sh                  shared helpers (locking, env-file management, health wait)
  deploy.sh               deploy one digest, auto-rollback on failure
  rollback.sh             restore the previous digest
  smoke-test.sh           external post-deploy verification
  lock-version.mjs        resolve exact versions from pnpm-lock.yaml
  test-lib.sh             unit tests for lib.sh (run via `pnpm run test:lib`)
Dockerfile                added a `migration` stage
package.json              added typecheck / lint:check / format:check / test:lib /
                          packageManager / engines, plus pnpm.overrides (§4.1)
.gitattributes            LF normalisation (required by the shell scripts)
```

Source files changed to make the gates pass from day one, all of them
pre-existing defects rather than new features:

| File | Change |
| --- | --- |
| `.npmrc` | rewritten as ASCII/LF (§3) |
| `src/shared/filters/global-exception.filter.ts` | `as any` → typed guard |
| `src/identity/presentation/types/authenticated-request.interface.ts` | **new** — types `req.user` |
| `src/identity/presentation/guards/jwt-auth.guard.ts` | typed request instead of `(request as any)` |
| `src/identity/presentation/guards/roles.guard.ts` | validates the JWT role claim via `isRole()` |
| `src/identity/presentation/decorators/current-user.decorator.ts` | typed request |
| `src/identity/infrastructure/services/jwt-token.service.ts` | `expiresIn ... as any` → `StringValue` |
| `src/identity/domain/value-objects/role.enum.ts` | added the `isRole()` type guard |
| `src/{identity,organization}/…/*.repository.ts` | `.map(Mapper.toDomain)` → arrow wrapper (3×) |
| `src/main.ts` | removed unused `NestLogger`; `void bootstrap()` |
| `src/database/prisma.service.ts` | removed unused `Logger` |
| `test/jest-e2e.json` | `moduleNameMapper` for `@/`, `@shared/`, `.js` suffixes |

## 3. Commands used, and where they came from

Every command is taken from the repository. None were invented.

| Purpose | Command | Source |
| --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` | `pnpm-lock.yaml` (lockfileVersion 9.0) |
| Prisma client | `pnpm exec prisma generate` | `Dockerfile` |
| Format check | `pnpm run format:check` | **added** — `pnpm format` writes files and is unusable as a gate |
| Lint | `pnpm run lint:check` | **added** — `pnpm lint` passes `--fix` and mutates the tree |
| Types | `pnpm run typecheck` | **added** — the repo had no type-check script |
| Build | `pnpm run build` | `package.json` (`nest build`) |
| Unit tests | `pnpm run test:cov` | `package.json` |
| e2e | `pnpm run test:e2e` | `package.json` (`test/jest-e2e.json`) |
| Migrations | `pnpm exec prisma migrate deploy` | `prisma.config.ts` |

`packageManager: pnpm@10.34.6` is pinned so CI and Docker agree. `pnpm/action-setup`
reads that field, so the version cannot drift between environments.

### `.npmrc` encoding fix (already applied)

`pnpm install` was failing in this repository with:

```text
ERR_INVALID_ARG_VALUE: The property 'options.env['npm_config_p_u_b_l_i_c___h_o_i_s_t___p_a_t_t_e_r_n_____']'
must be a string without null bytes. Received '\x00*\x00p\x00r\x00i\x00s\x00m\x00a\x00*\x00'
```

The committed `.npmrc` was **UTF-16 encoded from the `public-hoist-pattern` line
onwards** — the last line was stored as `p\x00u\x00b\x00l\x00i\x00c...` (33 stray
NUL bytes in a 145-byte file). pnpm read the corrupted value and passed it to
`child_process.spawn`, which rejects NUL bytes in environment variables.

This broke *every* `pnpm install`, on every platform, so it would have failed in
CI on the first run. `.npmrc` has been rewritten as plain ASCII with LF endings;
`pnpm config get public-hoist-pattern` now returns `*prisma*` and
`pnpm install --frozen-lockfile` succeeds.

The newly added `.gitattributes` (`* text=auto eol=lf`) prevents a recurrence by
normalising line endings and encoding on check-in.

## 4. Security gates

Implemented as blocking gates. Anything not listed as blocking is non-blocking
by design, not by omission.

| Control | Tool | Blocks on | Where |
| --- | --- | --- | --- |
| Secret scanning | gitleaks `v2.3.9` | any finding | PR + master |
| SAST | CodeQL `javascript-typescript`, `security-and-quality` | `error` severity alerts | PR + master |
| SCA | `pnpm audit --prod --audit-level=high` | HIGH or CRITICAL | PR + master |
| IaC | Trivy `config`/`misconfig` | HIGH or CRITICAL | PR + master |
| Container | Trivy `image`, by digest | CRITICAL | master |
| DAST | ZAP baseline | any `FAIL` risk | staging |
| Image signing | cosign keyless | verification failure | master + release |

Notes on the deliberate choices:

- **No SCA exceptions are configured.** All 11 pre-existing HIGH advisories were
  fixed at the source instead of being suppressed with an ignore list, so there is
  no `ignoreCves` to expire and the gate blocks on anything new. See §4.1.
- **Lint is fully blocking with no baseline.** The 22 pre-existing
  `no-unsafe-*` / `unbound-method` errors were fixed rather than suppressed
  (see §4.2), so `lint:check` is a genuine gate from day one.
- **Container scanning blocks on CRITICAL, not HIGH.** `node:22-alpine` base
  layers accumulate HIGH findings routinely; blocking on them would make the
  gate noise and teams would start ignoring it. High findings appear in the
  scan report artifact and in the build summary for human review.
- **Trivy config runs with `ignore-unfixed: true`**, so an unpatched CVE with no
  vendor fix available does not permanently block the pipeline.
- **CodeQL cannot publish SARIF from a fork PR** (read-only token). The analyze
  and upload steps are guarded; the remaining gates still run.
- **All third-party actions are pinned to a full 40-character commit SHA**, not a
  tag. A moved tag is a supply-chain compromise; a moved SHA is not. Dependabot
  keeps the pins current.

### 4.1 Why `--prod` does not exclude the Prisma CLI

`prisma` is declared in `devDependencies`, so `pnpm audit --prod` should ignore it.
It does not, and the reason is structural rather than a pnpm bug:

```
@prisma/client
  peerDependencies: { prisma: "*", typescript: ">=5.4.0" }
  peerDependenciesMeta: { prisma: { optional: true } }
```

pnpm satisfies that peer edge from the dev dependency, so `prisma` ends up in the
resolved **production** graph. Confirmed empirically, not assumed:

| Package | Reaches `node_modules` after `pnpm prune --prod`? |
| --- | --- |
| `prisma` (CLI) | yes — 40 MB |
| `@prisma/studio-core` | yes — 37 MB |
| `@prisma/dev` | yes — 14 MB |
| `mysql2` | yes |

That is ~93 MB, roughly 30% of the pruned tree, of build-time tooling inside the
runtime image. Three knob options were tested and all failed to remove it:

| Attempt | Result |
| --- | --- |
| `autoInstallPeers=false` in `.npmrc` | pnpm 10 ignores it there; it is read from `pnpm-workspace.yaml`. Moving it there changed the lockfile `settings:` block but `prisma` stayed in the prod graph. |
| `autoInstallPeers: false` in `pnpm-workspace.yaml` | lockfile regenerates cleanly, `prisma` still survives `prune --prod`. |
| `peerDependencyRules.ignoreMissing: [prisma]` | no effect; the peer is satisfied, not missing, so there is nothing to ignore. |

Because that edge cannot be removed, the advisories were fixed at the source
rather than suppressed. `package.json` pins three `pnpm.overrides`:

```jsonc
"pnpm": {
  "overrides": {
    "fast-uri": "^3.1.8",      // was 3.1.4 — 6 HIGH (SSRF / host confusion)
    "deepmerge-ts": "^8.0.2",  // was 7.1.5 — HIGH (stack exhaustion)
    "mysql2": "^3.24.5"        // was 3.15.3 — HIGH (auth plugin downgrade)
  }
}
```

`mysql2` and `deepmerge-ts` needed overriding because Prisma pins exact
versions (`"mysql2": "3.15.3"`), and `prisma@7.10.0` still pins the same
vulnerable build — there is no upstream release to pull. `@nestjs/platform-express`
was separately bumped `^11.0.1` → `^11.2.7`, which moved `multer` off the pinned
`2.2.0` and cleared the 3 HIGH file-upload advisories.

Overriding a dependency's transitive dependencies carries real risk, so it was
verified rather than assumed. Against a live Postgres 17:

| Check | Result |
| --- | --- |
| `prisma generate` | pass |
| `prisma validate` | pass |
| `prisma migrate deploy` on a **fresh** database (all 4 migrations, real DDL) | pass |
| `prisma migrate deploy` on the existing database | pass, no pending migrations |
| `pnpm audit --prod --audit-level=high` | **exit 0** — 1 low, 12 moderate remain |

`fast-uri`, `deepmerge-ts` and `mysql2` are all semver-compatible upgrades within
their major versions, and none is on a code path the application itself calls.
The 12 remaining moderate findings do not trip the `high` threshold.

The image bloat itself is **not** fixed — `prisma` still ships in the runtime
stage. That is recorded as a known limitation (§15.11) and as the top item in
§16, since
removing it needs a Dockerfile change rather than a dependency change.

### 4.2 Lint policy

The repository arrived with 22 ESLint errors and 1 warning. Rather than suppress
them or ship a non-blocking gate, each was fixed at the source:

| Problem | Fix |
| --- | --- |
| 9× `no-unsafe-*` in `global-exception.filter.ts` | replaced `original as any` with a `KnownErrorShape` interface and an `isKnownErrorShape` type guard |
| 3× `no-unsafe-*` on `req.user` | new `AuthenticatedRequest` interface; guards and `@CurrentUser()` now use `getRequest<AuthenticatedRequest>()` instead of an untyped or `as any` request |
| 2× `no-unsafe-assignment` from `expiresIn ... as any` | `getExpiry()` narrows to `ms.StringValue`, the type `jsonwebtoken` actually expects |
| 3× `unbound-method` on `.map(Mapper.toDomain)` | wrapped in an arrow function, so `this` cannot be lost |
| 1× unused `NestLogger`, 1× unused `Logger` | removed |
| 1× `no-floating-promises` on `bootstrap()` | `void bootstrap()`, with the reason recorded inline |

### 4.3 A real bug found by the deploy-script tests

`set_managed_env()` in `scripts/lib.sh` strips the managed block and re-appends
it with a single key. It was called twice per deploy — once for
`MIGRATION_IMAGE`, once for `INSPECT_IMAGE` — so the second call silently deleted
the first. The block ended up holding only `INSPECT_IMAGE`, and
`MIGRATION_IMAGE` fell back to whatever the operator's `.env` last had, which for
a fresh host is nothing at all.

That means `docker-compose.prod.yml` would have started the migration service
with an empty image reference. The deploy would not fail loudly at the point of
the bug; it would fail later, or deploy against a stale migration image.

The rewrite updates one key in place and preserves its siblings, and
`scripts/test-lib.sh` now covers it:

```
  PASS operator secret DB_PASSWORD survived
  PASS managed key INSPECT_IMAGE updated to the new digest
  PASS stale digest no longer present
  PASS exactly one managed block remains
  PASS env file mode stays 0600
  PASS no CRLF was introduced into the env file
  PASS re-running the same values changes nothing
```

This runs as its own job in `_quality.yml`. It needs no Node toolchain, no
Docker and no database — only bash — so it costs about five seconds and it is
the only automated coverage the host-side scripts have.

One of the lint fixes was a real latent authorization bug rather than a style issue:
`roles.guard.ts` compared the JWT `role` claim against the `Role` enum without
narrowing. A forged or malformed claim could not match a required role, so it
failed closed, but the comparison was unsound. `isRole()` now validates the
untrusted claim against the enum before it drives an authorization decision.

`lint:check` is therefore a real gate with no baseline file and no rule
downgrades. `pnpm lint` (`--fix`) remains available for local use but is never
run in CI, since auto-fixing and then reporting is not a check.

### Secret exceptions

There are none. If one becomes necessary it must be recorded in
`.gitleaksignore` with a `# Expires: YYYY-MM-DD` comment and a justification.
That file is the only sanctioned exception mechanism.

## 5. Secrets strategy

The guiding rule: **application secrets never enter GitHub.**

| Secret | Lives in | Why |
| --- | --- | --- |
| `DATABASE_URL` | target host `/opt/inspect/<env>/.env` | DB credentials should not be readable by anyone with repo write access |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | target host | same |
| GHCR pull credential | target host Docker config | so the deploy key cannot be used to exfiltrate images |
| SSH deploy key | GitHub Environment secrets | only needed to move bytes, not to serve traffic |
| `DEPLOY_SSH_KNOWN_HOSTS` | GitHub Environment secrets | pinning prevents MITM; see below |

GitHub Actions needs to authenticate to GHCR to push, which uses the automatic
`GITHUB_TOKEN` (`packages: write`). No long-lived registry credential is stored.

Separation is enforced by GitHub Environments. Each job sets
`environment: staging` or `environment: production`, so secrets resolve from
that environment only and cannot cross over.

### Secrets are never printed

- Private key and known_hosts are written to `~/.ssh/` with `0700`/`0600`, never
  echoed, and deleted in an `always()` step.
- `known_hosts` is **pinned as a secret**, not discovered with `ssh-keyscan`.
  Trust-on-first-use over SSH is how build hosts get silently re-pointed at an
  attacker. Provision the fingerprint deliberately:

  ```bash
  ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub   # on the target host
  # paste that fingerprint into the DEPLOY_SSH_KNOWN_HOSTS secret
  ```

- No `set -x` anywhere in a step that handles secret material.

## 6. Artifact and registry strategy

Registry: `ghcr.io/<owner>/inspect`, where `<owner>` is the lowercased
`github.repository`. It is computed at build time rather than hardcoded, so
forking the repository does not require editing a workflow.

Tags written by CI:

| Tag | Mutable | Written when | Referenced by deploy |
| --- | --- | --- | --- |
| `sha-<commit>` | no | at build | no |
| `untested-<commit>` | no | at build | no |
| `migration-sha-<commit>` | no | at build | no |
| `latest` / `migration-latest` | yes | **after** the scan gate | no |
| `<version>` / `migration-<version>` | yes | **after** the scan gate, release only | no |

**Deploys never reference a tag. They reference a `@sha256:` digest.** A tag can
be moved; a digest cannot. `scripts/lib.sh` enforces this with a regex and
refuses anything else, so a misconfigured pipeline fails before it can deploy a
mutable reference.

The `untested-` tag exists so an image is addressable for scanning before it is
promoted. The promotion tags are applied in a **separate job that depends on the
scan job**, which is what guarantees no deployable tag ever points at an
unscanned image.

### Provenance

- `provenance: mode=max` and `sbom: true` on both buildx builds → SLSA-style
  provenance and an SBOM attestation attached to each digest.
- Trivy also emits CycloneDX SBOMs as downloadable artifacts (30-day retention).
- Both digests are signed with cosign using the GitHub OIDC token. There is no
  long-lived signing key to store or rotate.

### Why two images

The `production` stage runs `pnpm prune --prod`, which removes the `prisma` CLI
because it is a devDependency. Migrations therefore cannot run from the app
image. The new `migration` stage ships only the pinned Prisma CLI plus
`prisma/`, and CI builds it from the same commit.

The Prisma CLI version is resolved from `pnpm-lock.yaml` at build time
(`scripts/lock-version.mjs`) rather than hardcoded, so the migration engine can
never be a different version than the client the app was compiled against.

## 7. Environments and configuration

```text
/opt/inspect/
  shared/
    docker-compose.prod.yml    synced from the repo by CI
    scripts/                   synced from the repo by CI
  staging/
    .env                       secrets, mode 600
    state/current-image        deployed digest
    state/previous-image       rollback target
    state/migration-image      migration digest
  production/
    ... same structure
```

- Compose project names are `inspect_staging` and `inspect_production`, so the
  two stacks have separate networks, containers and volumes.
- CI syncs **only** `docker-compose.prod.yml` and `scripts/`. No source, no
  `.env`, no secrets are ever copied to the host.
- `scripts/lib.sh` owns exactly two keys in the env file (`INSPECT_IMAGE`,
  `MIGRATION_IMAGE`) inside a `# >>> inspect-pipeline managed` block. Every other
  line is preserved, so a deploy can never clobber a secret it does not own.
- The same image moves between environments. Only configuration differs.
- `docker-compose.prod.yml` is deliberately standalone rather than an override of
  `docker-compose.yml`. Overrides need `build: !reset` (Compose >= 2.24) and
  silently inherit dev-only settings; the standalone file makes the production
  surface reviewable in one place.

## 8. Deployment strategy

**Recreate** (single container, `docker compose up -d`), chosen over rolling
because the app is stateless: no sticky sessions, no in-process cache that
matters between requests, and `dumb-init` forwards `SIGTERM` so Nest gets a
chance to close cleanly. A rolling strategy would need two containers behind a
load balancer, which this VPS topology does not have yet.

Order of operations per environment:

```text
acquire flock            (serialise; wait up to 900s)
  -> pull migration image
  -> prisma migrate deploy          (idempotent; before any code switch)
  -> record previous digest
  -> set INSPECT_IMAGE
  -> pull app image by digest
  -> compose up -d app
  -> poll healthcheck (180s, 15s start_period)
  -> commit state
```

Migrations run **before** the new version starts, so an incompatible schema
change is discovered while the old version is still serving.

| Property | Value |
| --- | --- |
| Health check | Docker `HEALTHCHECK` → `GET /health` |
| Health start period | 40s (Nest must boot and connect to Postgres) |
| Health timeout | 180s before the deploy is declared failed |
| Deployment lock | 900s `flock` per environment |
| Smoke test | external, from the runner, not from the host |
| DAST | ZAP baseline on staging only |

### Verification

`scripts/smoke-test.sh` runs against the **public URL from the CI runner**, so it
proves the service is reachable from outside the host, not merely that a
container started. It asserts:

1. `GET /health` returns 200 with `status: ok`
2. `POST /api/v1/auth/login` with invalid credentials returns 401/400 — this
   exercises the real routing, the Prisma-backed user lookup and the exception
   filter
3. helmet() security headers are present
4. an unknown route returns a clean 404 with no stack trace in the body

## 9. Rollback

**Triggers automatically** on any failure after the stack was modified:
migration failure, image pull failure, container unhealthy, health timeout.

**What is restored:** the exact digest in `state/previous-image`, i.e. the image
that was running before this deploy. Not a rebuild, not a tag.

**Can it be automated:** yes, and it is. `scripts/deploy.sh` installs an `ERR`
trap that calls `activate_image` with the previous digest, waits for health, and
still exits non-zero so CI reports the failure honestly. A manual rollback runs
the same code path:

```bash
scripts/rollback.sh --env production
scripts/rollback.sh --env production --to ghcr.io/<owner>/inspect@sha256:<digest>
```

**Migrations are not reverted.** This is intentional and is the reason rollback
can work at all after a schema change: rollback must remain possible when the
database has moved on. The consequence is a hard requirement on the schema:

> Every Prisma migration must be **backward compatible** with the previous
> application version. Additive only — add columns as nullable or with a
> default, never rename or drop in the same release that stops using them.
> Expand/contract across two releases: release N adds, release N+1 removes.

Reviewing this is a human responsibility; no tool enforces it. A CI check that
flags `DROP COLUMN` / `DROP TABLE` in a migration diff would be the next
improvement.

**How rollback is verified:** `rollback.sh` waits for the restored container to
become healthy and then runs the smoke test. If the smoke test fails it warns
loudly rather than reporting success.

Repeat-safe: rolling back to an already-deployed digest is a no-op, and rolling
back twice is detected and refused.

## 10. Observability

Every run publishes to the GitHub step summary:

| Run | Summary contents |
| --- | --- |
| PR | quality + security results |
| master | app digest, migration digest, pinned Prisma version, commit, both environment URLs |
| deploy | status, commit, both digests, migration flag, and — on failure — the exact rollback command |

Artifacts retained: coverage 7 days, image scan reports + SBOMs 30 days, DAST
reports 14 days, release notes 7 days.

DORA metrics (deployment frequency, lead time, change failure rate, MTTR) can be
computed from run metadata + deploy job status. No metrics pipeline ships yet.

Container logs are JSON via `nestjs-pino` with `json-file` rotation capped at
10 MB x 5 files per container. There is no log shipping or aggregation yet.

## 11. Concurrency and idempotency

| Resource | Mechanism | Effect |
| --- | --- | --- |
| CI, per environment | `concurrency.group` with `cancel-in-progress: false` | two deploys to one env never interleave |
| Host, per environment | `flock` on `state/deploy.lock` | protects against concurrent deploys from outside CI |
| Superseded commits | `cancel-in-progress: true` on PR and quality/security | no wasted minutes on commits nobody will merge |
| Re-running a failed job | digest comparison in `deploy.sh` | deploying an already-deployed digest exits 0 without touching the stack |

## 12. Enabling the production gate

`deploy-production` depends on the `production` GitHub Environment carrying
required reviewers. Until that is configured **the job runs unattended**, which
is not the intent. To activate it:

1. Repository -> Settings -> Environments -> New environment -> `production`
2. "Required reviewers": add yourself (and anyone else who should be able to
   release)
3. Add the environment secrets and the `PRODUCTION_BASE_URL` variable
4. Repeat for `staging` with its own secrets and `STAGING_BASE_URL`

```bash
# variables
gh variable set STAGING_BASE_URL   --env staging    --body 'https://staging.example.com'
gh variable set PRODUCTION_BASE_URL --env production --body 'https://api.example.com'

# secrets
gh secret set DEPLOY_HOST              --env staging
gh secret set DEPLOY_USER              --env staging
gh secret set DEPLOY_SSH_PRIVATE_KEY   --env staging
gh secret set DEPLOY_SSH_KNOWN_HOSTS   --env staging
# ...and the same set for production
```

Set `GHCR_TOKEN` on the repository only if a PAT is preferred over the default
`GITHUB_TOKEN`; the workflow falls back to `GITHUB_TOKEN` automatically.

## 13. Provisioning a target host

One-time, per host:

```bash
sudo useradd --system --create-home --shell /bin/bash deploy
sudo mkdir -p /opt/inspect/shared/scripts /opt/inspect/staging /opt/inspect/production
sudo chown -R deploy:deploy /opt/inspect
sudo chmod 700 /opt/inspect/*/.env 2>/dev/null || true

# allow the deploy key, restrict the user to what CI actually needs
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo install -m 600 -o deploy -g deploy /tmp/ci_deploy_key.pub /home/deploy/.ssh/authorized_keys

# give the host a pull credential for GHCR (read-only PAT), so the CI key
# cannot be used to read images
sudo -u deploy docker login ghcr.io -u "<your-ghcr-username>" --password-stdin < read-only-token.txt
```

Note GHCR requires a lowercase username and package path; the workflows
lowercase `github.repository` automatically, but `docker login` does not.

Then create each environment's `.env` by hand with the real secrets:

```bash
sudo -u deploy vi /opt/inspect/staging/.env
sudo chmod 600 /opt/inspect/staging/.env
```

```dotenv
# operator-managed — never touched by the pipeline
DB_USER=inspect_staging
DB_PASSWORD=<generated>
DB_NAME=inspect_staging
DATABASE_URL=postgresql://inspect_staging:<generated>@postgres:5432/inspect_staging?schema=public
JWT_SECRET=<32+ random bytes>
JWT_REFRESH_SECRET=<32+ different random bytes>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=15d
SERVER_PORT=3001

# pipeline-managed — do not edit by hand
# >>> inspect-pipeline managed - do not edit
# <<< inspect-pipeline managed
```

Generate secrets with `openssl rand -base64 48`. `JWT_SECRET` and
`JWT_REFRESH_SECRET` must differ; sharing them defeats refresh-token rotation.

## 14. Validation performed

Everything below was run locally on the actual repository before this change was
committed. Nothing in §1–§13 is aspirational.

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | pass (after the `.npmrc` fix in §3) |
| `pnpm exec prisma generate` | pass |
| `pnpm exec prisma validate` | pass |
| `pnpm exec prisma migrate deploy` (fresh DB, all 4 migrations) | pass |
| `pnpm run format:check` | pass |
| `pnpm run lint:check` | pass — **0 errors, 0 warnings** (was 22 + 1) |
| `pnpm run typecheck` | pass |
| `pnpm run build` + `dist/src/main.js` exists | pass |
| `pnpm run test:cov` | pass — 2 suites / 2 tests |
| `pnpm run test:e2e` (live Postgres 17) | pass |
| `pnpm run test:lib` (31 assertions, bash) | pass |
| `pnpm audit --prod --audit-level=high` | **exit 0** (1 low, 12 moderate) |
| `docker build --target migration` | pass |
| `docker build --target production` | pass — 748 MB |
| migration image → `migrate deploy` on a live DB | pass, reports Prisma 7.8.0 |
| production image runs as non-root, entrypoint present | pass (`whoami` → `node`) |
| `docker compose -f docker-compose.prod.yml config` | pass with a full env set; **fails loudly** when a required var is missing, as intended |
| `bash -n` on all 5 shell scripts | pass |
| `scripts/lock-version.mjs` (4 packages + error path) | pass |
| workflow YAML parse + structural contract check | pass |

Two observations worth recording:

- The production image is **748 MB**, of which `node_modules` is 382 MB, and the
  Prisma CLI is confirmed present inside it (`node_modules/prisma/package.json`).
  This is the §15.11 limitation, measured rather than estimated.
- `docker compose config` refuses to render the prod stack unless `DATABASE_URL`,
  `DB_*`, `INSPECT_IMAGE`, `MIGRATION_IMAGE` and both JWT secrets are all set.
  That failure mode is desirable: a misconfigured host cannot silently come up.

Not verifiable locally, and therefore untested until the first real run:

- Everything that needs GitHub: runners, Actions, GHCR push, cosign keyless
  signing, Trivy, CodeQL, gitleaks, ZAP.
- Everything that needs a target host: SSH deploy, rollback, the smoke test.
  The bash logic is unit-tested; the integration path is not.

## 15. Known limitations

1. **No coverage threshold is enforced.** Coverage is collected and uploaded
   but nothing fails below a line. The current suite is 2 spec files against 60+
   source files, so any real threshold fails immediately. Ratchet it up as
   coverage grows.
2. **Container HIGH vulnerabilities do not block.** See the rationale above.
3. **`node:22-alpine` and `postgres:17-alpine` are floating tags.** They are not
   pinned to a digest, so base-image updates are not fully reproducible. Pinning
   them requires periodic manual bumps.
4. **Only `lib.sh` has script tests.** `scripts/test-lib.sh` covers it with 31
   assertions and already found a real bug (§4.3), but `deploy.sh`,
   `rollback.sh` and `smoke-test.sh` are still exercised for the first time on a
   real deploy.
5. **Migrations are not linted for backward compatibility.** Rollback safety
   depends on reviewer discipline.
6. **No log shipping, metrics or alerting.** Failure is detected by CI and by
   health checks, not by observability.
7. **ZAP runs against `/health`**, which returns static JSON. It is a smoke-level
   DAST that confirms the proxy, TLS and routing work, not a real attack
   surface. Point it at an authenticated flow once one exists.
8. **The DAST heredoc inside the workflow** relies on Python 3 being present on
   `ubuntu-24.04`. It is, but the report parsing is more readable as a file.
9. **`gitleaks-action` requires a licence for organisations** on certain plans.
   Personal accounts are unaffected.
10. **`.npmrc` was UTF-16 corrupted until this change** (§3). It is fixed and
    guarded by `.gitattributes`, but any other config file in the repository
    could carry the same defect and there is nothing that checks encoding
    automatically.
11. **The Prisma CLI ships inside the runtime image.** `@prisma/client` declares
    an optional `prisma` peer, so pnpm keeps the CLI in the production graph and
    `pnpm prune --prod` does not remove it — ~93 MB, about 30% of the pruned tree
    (§4.1). Fixing this properly means building the runtime stage from a
    production-only install rather than pruning a full one, which would also let
    the three `pnpm.overrides` in §4.1 be dropped.
12. **Three `pnpm.overrides` carry the SCA gate.** They are verified against a
    live database, but they are overrides: a future Prisma release could change
    its internal expectations. Dependabot bumping `prisma` will not re-evaluate
    them, so a Prisma major bump needs the same migration check described in §15.5.

## 16. Next improvements

Ordered roughly by value per unit of effort.

**High**

1. Add real tests. Everything above is only as trustworthy as the suite it
   gates on, and there are two spec files.
2. Build the runtime stage from a production-only install so the Prisma CLI
   (~93 MB) stops shipping in the app image, and drop the `pnpm.overrides` from
   §4.1 once the advisories are genuinely out of the production graph.
2. Ratchet a coverage threshold once (1) lands.
3. Pin the base images to digests and automate the bump via Renovate/Dependabot.
4. Move `public-hoist-pattern` out of `.npmrc` into `pnpm-workspace.yaml` now
   that the encoding is fixed. Keeping array settings in a dotfile is what let
   the UTF-16 corruption go unnoticed.
5. Add a CI check that fails a PR whose migration diff contains
   `DROP COLUMN` / `DROP TABLE` / a rename, enforcing the rollback guarantee in
   §9 mechanically.
6. Set up `production` environment protection (§12) — this is the single
   highest-value change and takes two minutes.

**Medium**

7. Refactor the ZAP report parsing out of the heredoc into
   `scripts/dast-gate.py` and add a `local` profile so the DAST gate can be run
   locally before pushing.
8. Add staging smoke coverage for an authenticated flow (register + login +
   `POST /auth/refresh`) using a seeded CI user. This would catch auth
   regressions that the current unauthenticated checks miss.
9. Add `pnpm audit --dev` on a schedule with alerting, so dev-tooling CVEs are
   tracked without blocking releases.
10. Ship logs to Loki/Datadog/CloudWatch and add an error-rate alert tied to
    the deploy markers this pipeline already emits.
11. Move to blue/green with two app containers behind the existing reverse proxy
    when downtime becomes measurable.

**Low**

12. Add a `.trivyignore` with documented, expiring entries instead of relying on
    `--ignore-unfixed`.
13. Add SBOM diffing between releases to report newly introduced packages.
14. Add a `compose config` validation step in CI so `docker-compose.prod.yml` is
    schema-checked on every PR, not only at deploy time.
15. Cache `pnpm` more aggressively and move the unit-test job in parallel with
    `static-checks` once it no longer needs the Prisma client.
