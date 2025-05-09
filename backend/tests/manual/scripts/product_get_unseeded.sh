#!/bin/bash

API_BASE="http://localhost:8000"
HEADERS=(-H "Content-Type: application/json")

barcodes=(
  "3017620422003"
  "5000159484695"
  "5449000000996"
  "3274080005003"
  "3029330003533"
  "4008400402222"
  "8000500037560"
)

for BARCODE in "${barcodes[@]}"; do
  echo "Testing barcode: $BARCODE"
  echo "Calling /product/$BARCODE endpoint..."
  RESPONSE=$(curl -s "${API_BASE}/product/${BARCODE}" "${HEADERS[@]}")
  echo "Response:"
  echo "$RESPONSE"

  if echo "$RESPONSE" | grep -q '"name":'; then
    echo "Product success"
  else
    echo "Something failed"
  fi

  echo "----------------------------------------"
done
