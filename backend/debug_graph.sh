#!/bin/bash

# Microsoft Graph API Debug Script
# This script tests Graph API connectivity step by step

TENANT_ID="370b768b-f8cc-49ec-833b-ec26d74a51e5"
CLIENT_ID="06ad154d-55de-4fd4-9a75-100083c168b5"
CLIENT_SECRET="oiX8Q~fccwBhHnxIaGcHq00p52rbZeueApOVwduw"
GRAPH_BASE="https://graph.microsoft.com/v1.0"

echo "=== Step 1: Get App-Only Token ==="
TOKEN_RESPONSE=$(curl -s -X POST "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials")

echo "Token Response:"
echo "$TOKEN_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  exit 1
fi

echo ""
echo "=== Step 2: Test Token with /me endpoint (should fail for app-only) ==="
curl -s -X GET "${GRAPH_BASE}/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .

echo ""
echo "=== Step 3: Get Users ==="
USERS_RESPONSE=$(curl -s -X GET "${GRAPH_BASE}/users?\$select=id,displayName,mail,userPrincipalName&\$top=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Users Response:"
echo "$USERS_RESPONSE" | jq .

ERROR=$(echo "$USERS_RESPONSE" | jq -r '.error.code // empty')
if [ -n "$ERROR" ]; then
  echo "ERROR: Failed to get users - $ERROR"
  exit 1
fi

USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.value[0].id // empty')
if [ -z "$USER_ID" ]; then
  echo "ERROR: No users found"
  exit 1
fi

echo ""
echo "=== Step 4: Get Calendar for User: $USER_ID ==="
CALENDAR_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CALENDAR_END=$(date -u -d "+14 days" +"%Y-%m-%dT%H:%M:%SZ")

echo "Calendar URL: ${GRAPH_BASE}/users/${USER_ID}/calendarView?startDateTime=${CALENDAR_START}&endDateTime=${CALENDAR_END}&\$top=5"
CALENDAR_RESPONSE=$(curl -i -s -X GET "${GRAPH_BASE}/users/${USER_ID}/calendarView?startDateTime=${CALENDAR_START}&endDateTime=${CALENDAR_END}&\$top=5&\$select=subject,start,end" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Prefer: outlook.timezone=\"UTC\"")

echo "Raw Calendar Response (with headers):"
echo "$CALENDAR_RESPONSE"

# Extract body from response (after empty line)
CALENDAR_BODY=$(echo "$CALENDAR_RESPONSE" | sed -n '/^$/,$p' | tail -n +2)
echo ""
echo "Calendar Body (JSON):"
echo "$CALENDAR_BODY" | jq . 2>/dev/null || echo "$CALENDAR_BODY"

CALENDAR_ERROR=$(echo "$CALENDAR_BODY" | jq -r '.error.code // empty')
if [ -n "$CALENDAR_ERROR" ]; then
  echo "ERROR: Calendar failed - $CALENDAR_ERROR"
fi

echo ""
echo "=== Step 5: Get Mail for User: $USER_ID ==="
echo "Mail URL: ${GRAPH_BASE}/users/${USER_ID}/messages?\$top=5"
MAIL_RESPONSE=$(curl -i -s -X GET "${GRAPH_BASE}/users/${USER_ID}/messages?\$top=5&\$select=subject,from,receivedDateTime" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Raw Mail Response (with headers):"
echo "$MAIL_RESPONSE"

# Extract body from response (after empty line)
MAIL_BODY=$(echo "$MAIL_RESPONSE" | sed -n '/^$/,$p' | tail -n +2)
echo ""
echo "Mail Body (JSON):"
echo "$MAIL_BODY" | jq . 2>/dev/null || echo "$MAIL_BODY"

MAIL_ERROR=$(echo "$MAIL_BODY" | jq -r '.error.code // empty')
if [ -n "$MAIL_ERROR" ]; then
  echo "ERROR: Mail failed - $MAIL_ERROR"
fi

echo ""
echo "=== Debug Complete ==="
