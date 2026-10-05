#!/usr/bin/env bash
# ==============================================================================
# Shared helpers for the Inspect host-side deployment scripts.
# Sourced by deploy.sh, rollback.sh, smoke-test.sh and provision-notes in
# docs/ci-cd.md. Expects bash 4+ and GNU coreutils.
# ==============================================================================
set -euo pipefail

readonly INSPECT_ROOT="${INSPECT_ROOT:-/opt/inspect}"
readonly DEPLOY_LOCK_TIMEOUT="${DEPLOY_LOCK_TIMEOUT:-900}"   # seconds
readonly HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"             # seconds
readonly HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"             # seconds

# ---------------------------------------------------------------- logging ----
log()  { printf '\033[0;34m[%s]\033[0m %s\n' "$(date -u +%H:%M:%S)" "$*"; }
warn() { printf '\033[0;33m[%s] WARN\033[0m %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
die()  { printf '\033[0;31m[%s] FAIL\033[0m %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; exit 1; }
gh()   { printf '\033[0;35m[%s]\033[0m %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }

# ------------------------------------------------------------------ paths ----
env_dir()      { printf '%s/%s' "$INSPECT_ROOT" "$1"; }
state_dir()    { printf '%s/state' "$(env_dir "$1")"; }
compose_file() { printf '%s/shared/docker-compose.prod.yml' "$INSPECT_ROOT"; }

# Reject anything that is not a content-addressed digest reference. Mutable tags
# such as `:latest` are forbidden here on purpose: a deploy must name exactly
# one artifact.
validate_image_ref() {
  local ref="$1"
  # GHCR requires lowercase owner/repo, so the character classes are
  # lowercase-only by design. An uppercase repo would be rejected by the
  # registry anyway, so failing here gives a clearer error.
  if [[ ! "$ref" =~ ^ghcr\.io/[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*@sha256:[a-f0-9]{64}$ ]]; then
    die "Image reference must be an immutable GHCR digest (ghcr.io/owner/repo@sha256:<64 hex>), got: $ref"
  fi
}

validate_env_name() {
  local name="$1"
  [[ "$name" =~ ^(staging|production)$ ]] \
    || die "Unknown environment '$name' (expected: staging | production)"
}

compose() {
  local project="$1"; shift
  docker compose \
    --project-name "$project" \
    --env-file "$(env_dir "$project")/.env" \
    --file "$(compose_file)" \
    "$@"
}

project_name() { printf 'inspect_%s' "$1"; }

# Serialises deployments per environment so two CI runs cannot interleave
# `compose up` on the same stack. Held for the whole deploy including the
# health wait, which is what makes concurrent deploys safe to retry.
acquire_lock() {
  local env_name="$1"
  local lockfile
  lockfile="$(state_dir "$env_name")/deploy.lock"
  mkdir -p "$(dirname "$lockfile")"

  exec {lock_fd}>"$lockfile"
  if ! flock -w "$DEPLOY_LOCK_TIMEOUT" "$lock_fd"; then
    die "Timed out after ${DEPLOY_LOCK_TIMEOUT}s waiting for the $env_name deployment lock. Another deploy is still running."
  fi
  log "Acquired deployment lock for $env_name"
}

# ------------------------------------------------------- managed env file ----
# The deployment pipeline owns these keys and rewrites them every run. Every
# other line in the env file (secrets, operator settings) is left untouched, so
# a deploy can never clobber a secret it does not own.
readonly MANAGED_BEGIN="# >>> inspect-pipeline managed - do not edit"
readonly MANAGED_END="# <<< inspect-pipeline managed"

# Rewrites a single key inside the managed block, leaving every other line of the
# env file - operator secrets included - untouched.
#
# It sets ONE key without disturbing the others. Replacing the block wholesale
# would be shorter but would drop the sibling key, and both INSPECT_IMAGE and
# MIGRATION_IMAGE must be present at the same time for `compose up` to resolve.
set_managed_env() {
  local env_name="$1" key="$2" value="$3"
  local env_file; env_file="$(env_dir "$env_name")/.env"
  local tmp; tmp="$(mktemp)"

  [[ -f "$env_file" ]] || die "Env file not found: $env_file (run provisioning first)"

  awk -v b="$MANAGED_BEGIN" -v e="$MANAGED_END" -v k="$key" -v v="$value" '
    # The managed block is rewritten in place: a previous value of this key is
    # replaced, every other key inside the block is kept. Guarding on have_block
    # keeps the state from leaking between runs of this same script.
    $0 == b {
      inblock = 1
      have_key = 0
      print
      next
    }
    $0 == e {
      inblock = 0
      if (!have_key) print k "=" v
      print
      next
    }
    inblock {
      if (index($0, k "=") == 1) {
        # Replace this key in place; drop any duplicate occurrences of it.
        if (!have_key) {
          print k "=" v
          have_key = 1
        }
        next
      }
      print
      next
    }
    { print }
  ' "$env_file" > "$tmp"

  # No managed block existed at all: append one containing just this key.
  if ! grep -qF "$MANAGED_BEGIN" "$env_file"; then
    {
      cat "$env_file"
      echo "$MANAGED_BEGIN"
      printf '%s=%s\n' "$key" "$value"
      echo "$MANAGED_END"
    } > "$tmp"
  fi

  cat "$tmp" > "$env_file"
  rm -f "$tmp"
  chmod 600 "$env_file"
}

read_current_image() {
  local f; f="$(state_dir "$1")/current-image"
  [[ -f "$f" ]] && cat "$f" || true
}

read_previous_image() {
  local f; f="$(state_dir "$1")/previous-image"
  [[ -f "$f" ]] && cat "$f" || true
}

write_state() {
  local env_name="$1" previous="$2" current="$3"
  local dir; dir="$(state_dir "$env_name")"
  mkdir -p "$dir"
  printf '%s\n' "$previous" > "$dir/previous-image"
  printf '%s\n' "$current"  > "$dir/current-image"
}

# ------------------------------------------------------------- deployment ----
# Idempotent pull: compose skips work when the digest is already present.
pull_images() {
  local project="$1"
  log "Pulling immutable images"
  compose "$project" pull --quiet app
}

# Runs Prisma migrations with the migration image built from the same commit.
# Idempotent: `migrate deploy` is a no-op when no migration is pending.
run_migrations() {
  local project="$1"
  gh "Applying database migrations (schema version pinned to this commit)"
  if ! compose "$project" --profile migration up --abort-on-container-exit --exit-code-from migration migration; then
    die "Database migration failed. Refusing to start the new application version."
  fi
  compose "$project" rm -f migration >/dev/null 2>&1 || true
}

# Starts the app and blocks until Docker reports it healthy or the timeout
# elapses. Returns non-zero on timeout so the caller can roll back.
start_app() {
  local project="$1"
  log "Starting app container"
  if ! compose "$project" up -d --no-deps --remove-orphans app; then
    warn "compose up failed"
    return 1
  fi
  wait_for_healthy "$project"
}

wait_for_healthy() {
  local project="$1"
  local container cid deadline
  container="$(project_name "$project")-app-1"
  deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))

  log "Waiting for ${container} to become healthy (timeout ${HEALTH_TIMEOUT}s)"
  while [ "$(date +%s)" -lt "$deadline" ]; do
    cid="$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || true)"
    case "$cid" in
      healthy)   log "Container is healthy"; return 0 ;;
      unhealthy)
        warn "Container reported unhealthy"
        dump_app_logs "$project"
        return 1
        ;;
      missing)
        warn "Container not created yet"
        ;;
    esac
    sleep "$HEALTH_INTERVAL"
  done

  warn "Timed out after ${HEALTH_TIMEOUT}s waiting for a healthy container"
  dump_app_logs "$project"
  return 1
}

dump_app_logs() {
  local project="$1"
  warn "----- last 100 log lines -----"
  compose "$project" logs --no-color --tail 100 app >&2 2>&1 || true
  warn "---------------------------"
}

# Restores the previously deployed digest and waits for it to be healthy.
# This is the automatic rollback path: same mechanism a human would use.
activate_image() {
  local env_name="$1" image="$2"
  local project; project="$(project_name "$env_name")"

  validate_image_ref "$image"
  log "Activating $image"
  set_managed_env "$env_name" INSPECT_IMAGE "$image"
  set_managed_env "$env_name" MIGRATION_IMAGE "$(migration_image_for "$env_name")"

  compose "$project" pull --quiet app || return 1
  start_app "$project"
}

# Resolves the migration image digest recorded when the app image was deployed.
# Both digests are required because Compose interpolates every variable in the
# env file when parsing, so an empty MIGRATION_IMAGE would break any command.
migration_image_for() {
  local env_name="$1"
  local manifest; manifest="$(state_dir "$env_name")/migration-image"
  if [[ -f "$manifest" ]] && [[ -s "$manifest" ]]; then
    cat "$manifest"
  else
    die "No migration image recorded for $env_name. Pass --migration-image (the digest of the Dockerfile 'migration' stage for this commit)."
  fi
}

record_migration_image() {
  local env_name="$1" image="$2"
  mkdir -p "$(state_dir "$env_name")"
  printf '%s\n' "$image" > "$(state_dir "$env_name")/migration-image"
}
