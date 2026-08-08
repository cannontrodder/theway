#!/usr/bin/env bash
set -euo pipefail

export AWS_PROFILE=pep-bot
HOSTED_ZONE_NAME="cannontrodder.net."
RECORD_NAME="theway.cannontrodder.net"
RECORD_VALUE="cannontrodder.github.io"

if ! gh api "repos/cannontrodder/theway/pages" --jq '.cname' 2>/dev/null | grep -qx "$RECORD_NAME"; then
  echo "Pages is not yet serving ${RECORD_NAME}. Run configure-pages.sh first:" >&2
  echo "creating this record before Pages claims the domain opens a subdomain-takeover window." >&2
  exit 1
fi

zone_id=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${HOSTED_ZONE_NAME}'].Id | [0]" \
  --output text)

if [[ -z "$zone_id" || "$zone_id" == "None" ]]; then
  echo "Hosted zone ${HOSTED_ZONE_NAME} not found in profile ${AWS_PROFILE}." >&2
  exit 1
fi

echo "Zone ${zone_id}: UPSERT CNAME ${RECORD_NAME} -> ${RECORD_VALUE}"

change_id=$(aws route53 change-resource-record-sets \
  --hosted-zone-id "$zone_id" \
  --change-batch "{
    \"Comment\": \"theway site on GitHub Pages\",
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"${RECORD_NAME}\",
        \"Type\": \"CNAME\",
        \"TTL\": 300,
        \"ResourceRecords\": [{\"Value\": \"${RECORD_VALUE}\"}]
      }
    }]
  }" \
  --query 'ChangeInfo.Id' --output text)

echo "Waiting for ${change_id} to propagate..."
aws route53 wait resource-record-sets-changed --id "$change_id"
echo "Done. Enable Enforce HTTPS once GitHub has issued the certificate."
