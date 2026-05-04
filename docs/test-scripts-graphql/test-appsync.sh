#!/usr/bin/env bash

set -euo pipefail

# --- AppSync config ---
ENDPOINT="https://xxxxxxxxxxxxxxxxxxxxxxxxxxm.appsync-api.eu-central-1.amazonaws.com/graphql"
API_KEY="xxxxxxxxxxxxxxxxxxxxxxxx63m"
# --- END CONFIG ---

echo "Endpoint: $ENDPOINT"
START_TIME=$(date '+%Y-%m-%d %H:%M:%S.%N')
START_SEC=$(date '+%s.%N')

echo "Starting at: $START_TIME"

# 1. Prepare the GraphQL query
QUERY=$(jq -rn --arg q 'query listCourses { listCourses(filter: { courseId: { eq: "WEB_APP_2027" } }) { items { courseId courseItem schoolId schoolItem age email name createdAt } nextToken } }' '{ query: $q }')

# 2. Call AppSync
RESPONSE=$(curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$QUERY" \
  "$ENDPOINT")
EXIT_CODE=$?

END_TIME=$(date '+%Y-%m-%d %H:%M:%S.%N')
END_SEC=$(date '+%s.%N')

# 3. Compute latency in seconds (decimal)
if command -v bc >/dev/null 2>&1; then
  DURATION=$(echo "scale=6; $END_SEC - $START_SEC" | bc -l)
else
  DURATION="n/a (bc not installed)"
fi

# 4. Count how many items were returned
ITEMS=$(echo "$RESPONSE" | jq -r '.data.listCourses.items | length // 0')

echo "Complete at: $END_TIME"
echo "Latency for this request: ${DURATION} seconds"
echo "Total objects returned: ${ITEMS}"

# 5. Project latency for 1000 objects (linear scaling)
if command -v bc >/dev/null 2>&1 && [ "$ITEMS" -gt 0 ]; then
  PROJECTION=$(echo "scale=6; 1000 * $DURATION / $ITEMS" | bc -l)
  echo "Projected latency for 1000 objects: ${PROJECTION} seconds"
else
  echo "Cannot project 1000 objects (items = 0 or no bc)."
fi
