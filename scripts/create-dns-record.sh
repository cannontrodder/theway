#!/usr/bin/env bash
# Creates the CNAME that points the custom domain at GitHub Pages.
#
# Add the custom domain in the repo's Pages settings BEFORE running this.
# Creating the DNS record first opens a subdomain-takeover window: the name
# resolves to Pages while no repository has claimed it.
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-pep-bot}"
HOSTED_ZONE_NAME="cannontrodder.net."
RECORD_NAME="theway.cannontrodder.net"
RECORD_VALUE="cannontrodder.github.io"

export AWS_PROFILE

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
