#!/usr/bin/env bash
# ==============================================================================
# Deploy one immutable artifact to an environment, with automatic rollback.
# ==============================================================================
# Runs on the target host. Invoked by CI over SSH:
#
#   scripts/deploy.sh --env production \
#     --image ghcr.io/<owner>/inspect@sha256:<digest> \
#     --migration-image ghcr.io/<owner>/inspect-migration@sha256:<digest> \
#     [--skip-migrations]
#
# Guarantees:
#   - Never builds. The image is pulled by digest.
#   - Never promotes a mutable tag.
#   - Serialised per environment (flock), so re-running a failed job is safe.
#   - On any failure after the pull, the previous digest is restored and the
#     script still exits non-zero so CI reports the failure.
#   - Migrations run BEFORE the new version starts, and must be backward
#     compatible so the rollback target can still read the schema.
# ==============================================================================
set -euo pipefail

# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENV_NAME=""
IMAGE_REF=""
MIGRATION_IMAGE_REF=""
SKIP_MIGRATIONS="false"
SWITCHED="false"   # did we mutate the running stack? controls rollback

usage() {
  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)             ENV_NAME="${2:-}"; shift 2 ;;
    --image)           IMAGE_REF="${2:-}"; shift 2 ;;
    --migration-image) MIGRATION_IMAGE_REF="${2:-}"; shift 2 ;;
    --skip-migrations) SKIP_MIGRATIONS="true"; shift ;;
    -h|--help)         usage ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$ENV_NAME" && -n "$IMAGE_REF" ]] || usage
validate_env_name "$ENV_NAME"
validate_image_ref "$IMAGE_REF"

PROJECT="$(project_name "$ENV_NAME")"
CURRENT="$(read_current_image "$ENV_NAME")"

# Compose interpolates every variable in the env file while parsing, so both
# image references must be known before anything touches the stack.
if [[ -z "$MIGRATION_IMAGE_REF" ]]; then
  if [[ -z "$CURRENT" ]]; then
    usage
  fi
  MIGRATION_IMAGE_REF="$(migration_image_for "$ENV_NAME")"
  log "Reusing recorded migration image $MIGRATION_IMAGE_REF"
else
  validate_image_ref "$MIGRATION_IMAGE_REF"
fi

# Guard against a no-op deploy: re-running after success must not rewrite state.
if [[ "$CURRENT" == "$IMAGE_REF" ]]; then
  log "$IMAGE_REF is already the deployed artifact for $ENV_NAME - nothing to do (idempotent no-op)."
  exit 0
fi

record_migration_image "$ENV_NAME" "$MIGRATION_IMAGE_REF"

acquire_lock "$ENV_NAME"

log "Environment : $ENV_NAME"
log "Project     : $PROJECT"
log "Current     : ${CURRENT:-<none>}"
log "Deploying   : $IMAGE_REF"

rollback_on_failure() {
  local exit_code=$?
  warn "Deployment failed (exit ${exit_code})."

  if [[ "$SWITCHED" != "true" ]]; then
    die "Failure happened before the stack was modified; $ENV_NAME is untouched."
  fi

  if [[ -z "$CURRENT" ]]; then
    warn "No previous artifact recorded for $ENV_NAME - cannot roll back automatically."
    warn "Run 'docker compose --project-name $PROJECT ps' and inspect manually."
    exit "$exit_code"
  fi

  warn "Rolling $ENV_NAME back to $CURRENT"
  if activate_image "$ENV_NAME" "$CURRENT"; then
    warn "Rollback succeeded. $ENV_NAME is serving $CURRENT."
  else
    warn "ROLLBACK FAILED. Manual intervention required."
    warn "Previous artifact: $CURRENT"
  fi
  exit "$exit_code"
}
trap rollback_on_failure ERR

# --------------------------------------------------------------- deploy ----
# Migrations first: if the schema change is incompatible with the running
# version we want to discover that before swapping application containers.
if [[ "$SKIP_MIGRATIONS" != "true" ]]; then
  set_managed_env "$ENV_NAME" MIGRATION_IMAGE "$MIGRATION_IMAGE_REF"
  compose "$PROJECT" pull --quiet migration
  SWITCHED="true"   # schema may have advanced from here on
  run_migrations "$PROJECT"
else
  warn "Skipping migrations by explicit request."
fi

set_managed_env "$ENV_NAME" INSPECT_IMAGE "$IMAGE_REF"
pull_images "$PROJECT"
SWITCHED="true"

if ! start_app "$PROJECT"; then
  warn "New artifact failed to become healthy."
  false   # trigger the ERR trap
fi

trap - ERR
# After a successful deploy the image we just shipped becomes the new current,
# and the image we replaced becomes the rollback target.
write_state "$ENV_NAME" "$CURRENT" "$IMAGE_REF"

log "Deployment succeeded. $ENV_NAME is serving $IMAGE_REF"
gh "Rollback target for this release: ${CURRENT:-<none - first deployment>}"
