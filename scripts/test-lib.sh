#!/usr/bin/env bash
# ==============================================================================
# Unit tests for scripts/lib.sh.
#
# These functions decide what gets written to the host env file and which image
# a deploy is allowed to run, so they are the highest-risk code in the pipeline
# and the only part of it that mutates production state directly.
#
# Run: pnpm run test:lib   (or: bash scripts/test-lib.sh)
# Requires bash 4+ and GNU coreutils. No Node, no Docker, no database.
# ==============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

# lib.sh makes INSPECT_ROOT readonly from the environment, and set_managed_env
# writes under it, so the fixture root must be chosen before sourcing.
export INSPECT_ROOT="${INSPECT_ROOT:-/tmp/inspect-lib-test}"
source scripts/lib.sh

pass=0
fail=0

# NOTE: lib.sh runs under `set -euo pipefail` and its validators call die(),
# which exits. Each expectation is therefore evaluated in a subshell so a
# rejection is observed as a return code instead of killing the whole run.
expect() { # expect <label> <expected: ok|reject> <value> <fn> [args...]
  local label="$1" want="$2" value="$3" fn="$4"
  shift 4
  local rc=0
  ( "$fn" "$@" ) >/dev/null 2>&1 || rc=$?
  local got=reject
  [ "$rc" -eq 0 ] && got=ok

  if [ "$got" = "$want" ]; then
    printf '  PASS %s\n' "$label"
    pass=$((pass + 1))
  else
    printf '  FAIL %s (expected %s, got %s)\n' "$label" "$want" "$got"
    fail=$((fail + 1))
  fi
}

hex64() { head -c 64 /dev/zero | tr '\0' "${1:-a}"; }
# GHCR owner/repo must be lowercase; CI lowercases github.repository before
# building, so the fixture matches what the pipeline actually produces.
GOOD="ghcr.io/omarinspect/inspect@sha256:$(hex64 a)"

echo "validate_image_ref"
expect "accepts a valid ghcr digest ref" ok "$GOOD" validate_image_ref "$GOOD"

for bad in \
  "ghcr.io/o/i:latest" \
  "ghcr.io/o/i:sha-abc123" \
  "docker.io/library/node:22" \
  "ghcr.io/o/i@sha256:deadbeef" \
  "ghcr.io/o/i@sha256:$(hex64 A)" \
  "ghcr.io/Owner/i@sha256:$(hex64 a)" \
  "ghcr.io/o/i@sha512:$(hex64 a)" \
  "ghcr.io/o/i@sha256:$(hex64 a)z" \
  "not-an-image" \
  ""
do
  label="rejects [${bad:0:46}]"
  [ -z "$bad" ] && label="rejects [empty string]"
  expect "$label" reject "$bad" validate_image_ref "$bad"
done

echo "validate_env_name"
for e in staging production; do
  expect "accepts env '$e'" ok "$e" validate_env_name "$e"
done
for e in dev "" "../etc" "Production" "prod" "staging "; do
  label="rejects env [${e:-<empty>}]"
  expect "$label" reject "$e" validate_env_name "$e"
done

echo "project_name / env_dir are derived, never caller-supplied"
got_name="$(project_name staging)"
if [ "$got_name" = "inspect_staging" ]; then
  printf '  PASS project_name staging -> %s\n' "$got_name"; pass=$((pass + 1))
else
  printf '  FAIL project_name staging -> %s\n' "$got_name"; fail=$((fail + 1))
fi
got_dir="$(env_dir production)"
if [ "$got_dir" = "${INSPECT_ROOT}/production" ]; then
  printf '  PASS env_dir stays under INSPECT_ROOT\n'; pass=$((pass + 1))
else
  printf '  FAIL env_dir -> %s\n' "$got_dir"; fail=$((fail + 1))
fi

echo "set_managed_env preserves operator secrets"
rm -rf "$INSPECT_ROOT"
mkdir -p "$INSPECT_ROOT/staging"
cat > "$INSPECT_ROOT/staging/.env" <<'EOF'
NODE_ENV=production
DB_PASSWORD=super-secret-value
JWT_SECRET=another-secret
# >>> inspect-pipeline managed - do not edit
INSPECT_IMAGE=ghcr.io/o/i@sha256:stale
MIGRATION_IMAGE=ghcr.io/o/i@sha256:stale-mig
# <<< inspect-pipeline managed
SERVER_PORT=3001
EOF
chmod 600 "$INSPECT_ROOT/staging/.env"
cp "$INSPECT_ROOT/staging/.env" /tmp/before.env

set_managed_env staging INSPECT_IMAGE "$GOOD"
set_managed_env staging MIGRATION_IMAGE "ghcr.io/o/i@sha256:newmig"

echo "  --- resulting file ---"
sed 's/^/    /' "$INSPECT_ROOT/staging/.env"

# assert <label> <condition-as-shell> - runs the condition, counts pass/fail.
assert() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    printf '  PASS %s\n' "$label"; pass=$((pass + 1))
  else
    printf '  FAIL %s\n' "$label"; fail=$((fail + 1))
  fi
}

env_file="$INSPECT_ROOT/staging/.env"

assert "operator secret DB_PASSWORD survived" \
  grep -q "DB_PASSWORD=super-secret-value" "$env_file"
assert "operator secret JWT_SECRET survived" \
  grep -q "JWT_SECRET=another-secret" "$env_file"
assert "operator NODE_ENV survived" \
  grep -q "NODE_ENV=production" "$env_file"
assert "trailing operator setting SERVER_PORT survived" \
  grep -q "SERVER_PORT=3001" "$env_file"
assert "managed key INSPECT_IMAGE updated to the new digest" \
  grep -q "INSPECT_IMAGE=$GOOD" "$env_file"
assert "stale digest no longer present" \
  bash -c "! grep -q 'sha256:stale' '$env_file'"
assert "exactly one managed block remains" \
  test "$(grep -c 'inspect-pipeline managed' "$env_file")" -eq 2
assert "env file mode stays 0600" \
  test "$(stat -c '%a' "$env_file")" = "600"
assert "no CRLF was introduced into the env file" \
  bash -c "! grep -q \$'\\r' '$env_file'"

echo "set_managed_env is idempotent"
before="$(cat "$env_file")"
set_managed_env staging INSPECT_IMAGE "$GOOD" 2>/dev/null
set_managed_env staging MIGRATION_IMAGE "ghcr.io/o/i@sha256:newmig" 2>/dev/null
assert "re-running the same values changes nothing" \
  test "$before" = "$(cat "$env_file")"

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
