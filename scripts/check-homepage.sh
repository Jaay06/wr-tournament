#!/usr/bin/env bash

set -eu

tournament_url="${TOURNAMENT_URL:-http://localhost:3000}"
page_body="$(curl --fail --silent --show-error "$tournament_url/")"

if ! printf '%s' "$page_body" | rg -qi 'Rift Clash'; then
  printf 'FAIL: the homepage did not render the tournament title\n' >&2
  exit 1
fi

if ! printf '%s' "$page_body" | rg -q 'Private tournament'; then
  printf 'FAIL: the homepage did not render the private-access marker\n' >&2
  exit 1
fi

rules_body="$(curl --fail --silent --show-error "$tournament_url/rules")"

if ! printf '%s' "$rules_body" | rg -q 'Know what blocks a roster'; then
  printf 'FAIL: the public rules page did not render its title\n' >&2
  exit 1
fi

if ! printf '%s' "$rules_body" | rg -q 'Five starters' \
  || ! printf '%s' "$rules_body" | rg -q 'Maximum one T1' \
  || ! printf '%s' "$rules_body" | rg -q 'Maximum two T2'; then
  printf 'FAIL: the public rules page did not render the roster limits\n' >&2
  exit 1
fi

printf 'PASS: the homepage and public rules page rendered\n'
