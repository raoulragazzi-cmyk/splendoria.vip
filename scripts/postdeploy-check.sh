#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://www.splendoria.vip}"
CURL=(curl --silent --show-error --location --max-time 15 --connect-timeout 5)

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

check_200() {
  local path="$1"
  local code
  code="$(${CURL[@]} --output /dev/null --write-out '%{http_code}' "$BASE_URL$path")" || fail "$path non raggiungibile"
  [[ "$code" == "200" ]] || fail "$path -> HTTP $code (atteso 200)"
  pass "$path -> HTTP 200"
}

check_redirect_or_200() {
  local path="$1"
  local code
  code="$(curl --silent --show-error --max-time 15 --connect-timeout 5 --output /dev/null --write-out '%{http_code}' "$BASE_URL$path")" || fail "$path non raggiungibile"
  case "$code" in
    200|301|302|303|307|308) pass "$path -> HTTP $code" ;;
    *) fail "$path -> HTTP $code (atteso pagina o redirect controllato)" ;;
  esac
}

echo "Splendoria post-deploy check: $BASE_URL"
check_200 "/"
check_200 "/accedi"
check_200 "/registrati"
check_200 "/privacy-policy"
check_redirect_or_200 "/studio"
check_redirect_or_200 "/admin"

echo "PASS: controlli pubblici Splendoria completati."
