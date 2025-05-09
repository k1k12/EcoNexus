#!/bin/bash

API="http://127.0.0.1:8000"

echo "--------- LOGIN as Sofia ---------"
LOGIN_RESPONSE=$(curl -s -X POST "$API/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=sofia@test.com&password=test")

SOFIA_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [[ -z "$SOFIA_TOKEN" || "$SOFIA_TOKEN" == "null" ]]; then
  echo "Login failed. Aborting."
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $SOFIA_TOKEN"

echo
echo "--------- GET: All points for GSS code ---------"
curl -s -X GET "$API/recycling-points?gss_code=TEST-GSS-001" -H "$AUTH_HEADER" | jq

echo
echo "--------- GET: Single point by ID ---------"
FIRST_ID=$(curl -s -X GET "$API/recycling-points?gss_code=TEST-GSS-001" -H "$AUTH_HEADER" | jq '.[0].point_id')

if [[ -n "$FIRST_ID" && "$FIRST_ID" != "null" ]]; then
  curl -s -X GET "$API/recycling-points?point_id=$FIRST_ID" -H "$AUTH_HEADER" | jq
else
  echo "No point_id found for test."
fi

echo
echo "--------- GET: Points within bounding box (Newcastle) ---------"
curl -s -X GET "$API/recycling-points?min_lat=54.97&max_lat=54.99&min_lon=-1.62&max_lon=-1.59" -H "$AUTH_HEADER" | jq

echo
echo "--------- GET: Points near lat/lon (Newcastle, radius 2km) ---------"
curl -s -X GET "$API/recycling-points?near_lat=54.9745&near_lon=-1.5953&radius_km=2" -H "$AUTH_HEADER" | jq

echo
echo "--------- GET: Points with materials (Newcastle location) ---------"
MATERIAL_IDS=$(curl -s -X GET "$API/materials" -H "$AUTH_HEADER" | jq -r '.[0:2] | map("material_ids=" + (.material_id|tostring)) | join("&")')

if [[ -n "$MATERIAL_IDS" ]]; then
  curl -s -X GET "$API/recycling-points?near_lat=54.9745&near_lon=-1.5953&radius_km=5&$MATERIAL_IDS" -H "$AUTH_HEADER" | jq
else
  echo "No material_ids available to test"
fi

echo
echo "All GET tests done."
