# Product Doc

---

## Endpoint Summary

This endpoint retrieves data about a product based on its barcode. It will:
1. First try to find the product in our postgres db.
2. If not found, query OFF API
3. If successful and valid, save the product in our own db

---

## Request

### Path Parameter

| Name | Type | Description |
|------|------|-------------|
| `barcode` | `str` | A 13-digit EAN barcode |

---

## Response

Returns a JSON object containing product data.

### Example Response (`200 OK`):
```json
{
  "name": "Super Glass Bottle",
  "barcode": "4006381333931",
  "material": "Glass",
  "recyclable": true
}