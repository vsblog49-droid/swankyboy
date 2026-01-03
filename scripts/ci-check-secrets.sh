#!/usr/bin/env bash
set -euo pipefail

REQUIRED=(
  AMAZON_ACCESS_KEY
  AMAZON_SECRET_KEY
  AMAZON_PARTNER_TAG
  OPENAI_API_KEY
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN
  D1_DATABASE_ID
)

missing=()
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing required secrets: ${missing[*]}" >&2
  exit 1
fi

# Lightweight check: verify Cloudflare token (does not print token)
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify")

if [ "$status" != "200" ]; then
  echo "Cloudflare token verification failed (status $status)" >&2
  exit 1
fi

echo "All required secrets are present and Cloudflare token verified."