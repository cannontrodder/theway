#!/usr/bin/env bash
set -euo pipefail

REPO="cannontrodder/theway"
DOMAIN="theway.cannontrodder.net"

if ! gh api "repos/${REPO}/pages" >/dev/null 2>&1; then
  gh api --method POST "repos/${REPO}/pages" -f build_type=workflow
fi

gh api --method PUT "repos/${REPO}/pages" -f build_type=workflow -f cname="${DOMAIN}"

echo "Pages serving ${DOMAIN} from Actions. Next: scripts/create-dns-record.sh"
