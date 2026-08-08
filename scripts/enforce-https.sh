#!/usr/bin/env bash
set -euo pipefail

REPO="cannontrodder/theway"

if ! gh api --method PUT "repos/${REPO}/pages" -F https_enforced=true 2>/dev/null; then
  echo "GitHub has not issued the certificate yet. It follows DNS resolution and can" >&2
  echo "take up to 24 hours; re-run this once it exists." >&2
  exit 1
fi

gh api "repos/${REPO}/pages" --jq '{cname, https_enforced}'
