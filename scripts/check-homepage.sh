#!/usr/bin/env bash

set -eu

tournament_url="${TOURNAMENT_URL:-http://localhost:3000}"
page_body="$(curl --fail --silent --show-error "$tournament_url/")"

if ! printf '%s' "$page_body" | rg -q 'RIFT CLASH'; then
  printf 'FAIL: the homepage did not render the tournament title\n' >&2
  exit 1
fi

if ! printf '%s' "$page_body" | rg -q 'Private tournament'; then
  printf 'FAIL: the homepage did not render the private-access marker\n' >&2
  exit 1
fi

printf 'PASS: the private tournament homepage rendered\n'
