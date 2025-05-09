#!/bin/bash

API="http://127.0.0.1:8000"

echo "--------- 1) LOGIN as Sofia ---------"
LOGIN_RESPONSE=$(curl -s -X POST "$API/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=sofia@test.com&password=test")

echo "Raw login response:"
echo "$LOGIN_RESPONSE"
echo

if [[ -z "$LOGIN_RESPONSE" ]]; then
  echo "Login response is empty. Check if server is running or /login route is correct."
  exit 1
fi

SOFIA_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
if [[ -z "$SOFIA_TOKEN" ]]; then
  echo "Failed to extract token"
  exit 1
fi
echo "Got token: $SOFIA_TOKEN"

echo
echo "--------- 2) Fetching user info and materials ---------"
SOFIA_INFO=$(curl -s -X GET "$API/user-info" -H "Authorization: Bearer $SOFIA_TOKEN")
SOFIA_ID=$(echo "$SOFIA_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user_id', ''))")
echo "Sofia's user ID: $SOFIA_ID"

MATERIALS=$(curl -s -X GET "$API/materials" -H "Authorization: Bearer $SOFIA_TOKEN")
MAT_IDS=$(echo "$MATERIALS" | python3 -c "
import sys, json
mats = json.load(sys.stdin)
ids = [m['material_id'] for m in mats[:2]]
print(ids if len(ids) >= 2 else '')
")

if [[ -z "$MAT_IDS" ]]; then
  echo "Failed to retrieve 2 valid material IDs"
  exit 1
fi
echo "Using material IDs: $MAT_IDS"

echo
echo "--------- 3) CREATE a new recycling point ---------"

CREATE_PAYLOAD=$(cat <<EOF
{
  "new": [{
    "point_id": -1,
    "user_id": $SOFIA_ID,
    "gss_code": "TEST-GSS-001",
    "material_ids": $MAT_IDS,
    "latitude": 53.9123,
    "longitude": -1.5123,
    "times_open": {
      "monday": ["08:00", "17:00"],
      "tuesday": ["08:00", "17:00"],
      "wednesday": ["08:00", "17:00"],
      "thursday": ["08:00", "17:00"],
      "friday": ["08:00", "17:00"],
      "saturday": ["Closed", "Closed"],
      "sunday": ["Closed", "Closed"]
    }
  }],
  "updated": [],
  "deleted": []
}
EOF
)

RAW_CREATE_RESPONSE=$(curl -s -X POST "$API/recycling-points" \
  -H "Authorization: Bearer $SOFIA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

echo "Raw create response:"
echo "$RAW_CREATE_RESPONSE" | python3 -m json.tool

NEW_ID=$(echo "$RAW_CREATE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
new = data.get('new', [])
print(list(new[0].keys())[0] if new else '')
")

if [[ -z "$NEW_ID" ]]; then
  echo "Create failed or no 'new' entry found, aborting."
  exit 1
fi
echo "Created recycling point with ID = $NEW_ID"

echo
echo "--------- 4) UPDATE point $NEW_ID ---------"

UPDATE_PAYLOAD=$(cat <<EOF
{
  "new": [],
  "updated": [{
    "point_id": $NEW_ID,
    "changed_fields": {
      "latitude": 53.9222,
      "user_id": $SOFIA_ID
    }
  }],
  "deleted": []
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X POST "$API/recycling-points" \
  -H "Authorization: Bearer $SOFIA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

echo "Raw update response:"
if [[ -n "$UPDATE_RESPONSE" ]]; then
  echo "$UPDATE_RESPONSE" | python3 -m json.tool
else
  echo "Update failed. Empty response."
fi

echo
echo "--------- 5) DELETE point $NEW_ID ---------"

DELETE_PAYLOAD=$(cat <<EOF
{
  "new": [],
  "updated": [],
  "deleted": [$NEW_ID]
}
EOF
)

curl -s -X POST "$API/recycling-points" \
  -H "Authorization: Bearer $SOFIA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DELETE_PAYLOAD" | python3 -m json.tool

echo
echo "All create -> update -> delete RP steps completed."
