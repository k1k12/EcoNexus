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

# Barcodes from your seeding script
BARCODES=("3029330003533" "5000159484695" "5449000000996" "4006381333931")

echo
for BARCODE in "${BARCODES[@]}"; do
  echo "--------- GET: Product with barcode $BARCODE ---------"
  curl -s -X GET "$API/product/$BARCODE" -H "$AUTH_HEADER" | jq
  echo
done

echo "Product endpoint tests complete."
