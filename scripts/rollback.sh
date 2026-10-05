#!/usr/bin/env bash
# ==============================================================================
# Roll an environment back to the previously deployed artifact.
# ==============================================================================
# Runs on the target host, or locally by an operator with shell access:
#
#   scripts/rollback.sh --env production
#   scripts/rollback.sh --env production --to ghcr.io/<owner>/inspect@sha256:<digest>
#
# Safety properties:
#   - Never runs migrations. Rollback must work even when the schema has moved
#     on, which is why every Prisma migration in this repo must be backward
#     compatible with the previous application version.
#   - Verifies the restored container reaches a healthy state before exiting 0.
#   - Repeats are safe: rolling back twice to the same digest is a no-op.
# ==============================================================================
set -euo pipefail

# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENV_NAME=""
TARGET_IMAGE=""
SKIP_SMOKE="false"

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)        ENV_NAME="${2:-}"; shift 2 ;;
    --to)         TARGET_IMAGE="${2:-}"; shift 2 ;;
    --skip-smoke) SKIP_SMOKE="true"; shift ;;
    -h|--help)    usage ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$ENV_NAME" ]] || usage
validate_env_name "$ENV_NAME"

CURRENT="$(read_current_image "$ENV_NAME")"
PREVIOUS="$(read_previous_image "$ENV_NAME")"

if [[ -z "$TARGET_IMAGE" ]]; then
  TARGET_IMAGE="$PREVIOUS"
fi

[[ -n "$TARGET_IMAGE" ]] \
  || die "No rollback target recorded for $ENV_NAME (state dir: $(state_dir "$ENV_NAME")). Pass --to <image@sha256:...>."
validate_image_ref "$TARGET_IMAGE"

[[ "$TARGET_IMAGE" != "$CURRENT" ]] \
  || die "$ENV_NAME is already running $TARGET_IMAGE - nothing to roll back."

acquire_lock "$ENV_NAME"

log "Environment  : $ENV_NAME"
log "Replacing    : ${CURRENT:-<none>}"
log "Rollback to  : $TARGET_IMAGE"
warn "Migrations are NOT reverted. Confirm every migration applied since $TARGET_IMAGE is backward compatible."

if ! activate_image "$ENV_NAME" "$TARGET_IMAGE"; then
  die "Rollback target did not become healthy. Container logs: scripts/rollback.sh --env $ENV_NAME (see 'compose logs app')."
fi

# The rolled-back artifact is now current; whatever it replaced becomes the
# target for a roll-forward.
write_state "$ENV_NAME" "$CURRENT" "$TARGET_IMAGE"

log "Rollback complete. $ENV_NAME is serving $TARGET_IMAGE"

if [[ "$SKIP_SMOKE" != "true" ]]; then
  port="$(grep -E '^SERVER_PORT=' "$(env_dir "$ENV_NAME")/.env" 2>/dev/null | cut -d= -f2 || true)"
  port="${port:-3000}"
  "$INSPECT_ROOT/shared/scripts/smoke-test.sh" --url "http://127.0.0.1:${port}" || \
    warn "Smoke test reported a problem after rollback - investigate before declaring the incident closed."
fi
