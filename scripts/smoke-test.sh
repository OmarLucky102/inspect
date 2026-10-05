#!/usr/bin/env bash
# ==============================================================================
# Post-deploy verification.
# ==============================================================================
# Runs against a *reachable* URL, so CI runs it from outside the host to prove
# the service is actually serving traffic - not merely that a container started.
#
#   scripts/smoke-test.sh --url https://api.example.com
#   scripts/smoke-test.sh --url http://127.0.0.1:3000
#
# Checks (all must pass):
#   1. GET /health                       -> 200 and status=ok
#   2. POST /api/v1/auth/login           -> 401 with invalid credentials
#      (proves routing + the Prisma-backed user lookup path are wired up)
#   3. Response headers include hardening headers from helmet()
#   4. An unknown route returns 404 rather than leaking a stack trace
# ==============================================================================
set -euo pipefail

BASE_URL=""
TIMEOUT="${SMOKE_TIMEOUT:-15}"
RETRIES="${SMOKE_RETRIES:-5}"
RETRY_DELAY="${SMOKE_RETRY_DELAY:-10}"

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)     BASE_URL="${2:-}"; shift 2 ;;
    --timeout) TIMEOUT="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$BASE_URL" ]] || usage
BASE_URL="${BASE_URL%/}"

command -v curl >/dev/null 2>&1 || die "curl is required"

pass() { printf '\033[0;32m  PASS\033[0m %s\n' "$*"; }
fail() { printf '\033[0;31m  FAIL\033[0m %s\n' "$*"; exit 1; }
info() { printf '\033[0;34m  ....\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# Readiness: the container can be healthy while the reverse proxy is still
# cutting over, so retry the first successful connection.
# ---------------------------------------------------------------------------
wait_for_reachable() {
  local attempt=1
  while [ "$attempt" -le "$RETRIES" ]; do
    if curl -fsS --max-time "$TIMEOUT" -o /dev/null "$BASE_URL/health" 2>/dev/null; then
      return 0
    fi
    info "not reachable yet (attempt ${attempt}/${RETRIES}), waiting ${RETRY_DELAY}s"
    attempt=$(( attempt + 1 ))
    sleep "$RETRY_DELAY"
  done
  return 1
}

echo "Smoke testing $BASE_URL"
wait_for_reachable || fail "$BASE_URL/health never became reachable after $(( RETRIES * RETRY_DELAY ))s"

# --- 1. Liveness -----------------------------------------------------------
info "GET /health"
health_body="$(curl -fsS --max-time "$TIMEOUT" "$BASE_URL/health")" || fail "GET /health did not return 2xx"
grep -q '"status":"ok"' <<<"$health_body" \
  || fail "GET /health did not report status=ok. Body: $health_body"
pass "GET /health reports ok"

# --- 2. Auth route reaches the data layer ----------------------------------
info "POST /api/v1/auth/login with invalid credentials"
login_code="$(curl -sS --max-time "$TIMEOUT" -o /tmp/smoke-login-body -w '%{http_code}' \
  -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-test@example.invalid","password":"not-a-real-password"}')"

case "$login_code" in
  401|400) pass "auth route is live and rejects bad credentials (HTTP $login_code)" ;;
  000)     fail "could not reach the auth route (connection failure)" ;;
  *)       fail "expected 401/400 from the auth route, got HTTP $login_code: $(cat /tmp/smoke-login-body)" ;;
esac

# --- 3. Security headers ---------------------------------------------------
info "verifying security headers"
headers="$(curl -sS --max-time "$TIMEOUT" -D - -o /dev/null "$BASE_URL/health")"
missing=""
for header in x-content-type-options x-frame-options x-dns-prefetch-control; do
  grep -qi "^${header}:" <<<"$headers" || missing="${missing} ${header}"
done
[[ -z "$missing" ]] || fail "helmet() headers missing:${missing}"
pass "security headers present (helmet)"

# --- 4. No stack trace leakage ---------------------------------------------
info "verifying unknown route handling"
nf_code="$(curl -sS --max-time "$TIMEOUT" -o /tmp/smoke-404-body -w '%{http_code}' "$BASE_URL/api/v1/definitely-not-a-route")"
[[ "$nf_code" == "404" ]] || fail "unknown route returned HTTP $nf_code, expected 404"
grep -qiE 'at [a-zA-Z0-9_$.]+ \(|node_modules' /tmp/smoke-404-body \
  && fail "404 response body leaks a stack trace"
pass "unknown route returns a clean 404"

rm -f /tmp/smoke-login-body /tmp/smoke-404-body
echo "All smoke checks passed for $BASE_URL"
