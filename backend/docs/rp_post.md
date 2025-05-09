# POST `/recycling-points` — Test Coverage & Behaviour

This document describes in detail how the POST `/recycling-points` endpoint behaves, how the test suite operates, and what to expect for every possible combination of inputs and outputs.

---

## Authentication

- **Header**: `Authorization: Bearer <JWT>`  
- **Failures**:  
  - Missing or malformed -> **401 Unauthorised**  


## Payload Structure

The request body **must** be a JSON object with three top‑level keys:

`{
  "new":     [ /* zero or more point‑creation objects */ ],
  "updated": [ /* zero or more { point_id, changed_fields } */ ],
  "deleted": [ /* zero or more point_id integers */ ]
}`

### `new`

List of objects each with:

- `user_id` (string or int)
- `gss_code` (string)
- `material_ids` (non‑empty list of ints)
- `latitude`: float (–90…90)
- `longitude`: float (–180…180)
- `times_open`: map of 7 weekdays -> 2‑tuple of strings or "Closed"

### `updated`

List of { `point_id`: int, `changed_fields`: { <any subset of the above fields> } }


### `deleted`

List of int `point_id`'s

### Validation Errors -> 422 Unprocessable Entity

- Missing any of the three top keys
- Bad JSON shape (e.g. array instead of object)
- Non int or out‑of‑range `latitude`/`longitude`
- Empty or malformed `times_open`
- `material_ids` containing non‑ints or empty list

## Role‑Based Permissions

| **Role**                  | **Create** | **Update** | **Delete** |
|:-------------------------:|:----------:|:----------:|:----------:|
| **Council**               |     y      |     y      |     y      |
| **Admin**                 |     y      |     y      |     y      |
| **User**                  |     n      |     n      |     n      |
| **Guest**                 |     n      |     n      |     n      |
| *Council (unapproved)*    |     n      |     n      |     n      |

- All 'n' returns 403

## Bulk‑Operation Branching

### Creates (new)

- Each entry attempted independently.
- Successful -> status 201, returned in `new` list.
- Failure (validation, duplicate location, bad material, wrong GSS/user) -> error entry.

### Updates (updated)

- Each entry attempted independently.
- Successful -> status 200, returned in `updated` list.
- Failure (bad ID -> 404, invalid fields -> 422, forbidden -> 403) -> error entry.

### Deletes (deleted)

- Each ID attempted independently.
- Successful -> status 200, returned in `deleted` list.
- Failure (no permission -> 403, not found -> 404) -> error entry.

### All
- Can be empty payload (new=[],updated=[],deleted=[])
- No operations allowed -> global error under `ALL` -> status *always* 207 + error inside `errors` status 400.


## Common Response Shape

All top‑level responses (except 422) use **207 Multi‑Status** or **201 Created**:

```{python}
{
  "new":     [ /* list of { "<temp_id>": { status, result?, error? } } */ ],
  "updated": [ /* list of { "<point_id>": { status, result?, error? } } */ ],
  "deleted": [ /* list of { "<point_id>": { status, error? } } */ ],
  "errors":  [ /* list of { "<point_id or ALL>": { status, error } } */ ]
}
```

- `status`: HTTP status of that sub‑operation
- `result`: the created/updated object on success
- `error`: human‑readable message on failure

### Scenarios

### Create Scenarios

| **Scenario**                     | **Payload Example**                      | **HTTP Status** | **Notes**                          |
|----------------------------------|------------------------------------------|------------------|-------------------------------------|
| Council creates 1               | `new=[{...}]`                            | `201`           | One new point, success              |
| Guest/user tries to create      | `new=[{...}]`                            | `403`           | Forbidden                           |
| Multiple valid creates (council)| `new=[p1, p2]`                           | `201` or `207`  | Each processed individually         |
| Missing required field          | `new=[{ no_latitude }]`                 | `422`           | FastAPI schema validation           |
| Invalid material ID             | `material_ids=[99999]`                  | `207`           | One error entry, others succeed     |
| Duplicate coordinates           | Two identical points                     | `207`           | One fails with 400                  |
| Bad `times_open` format         | `"monday": "08:00-17:00"`               | `422` or `207`  | Schema or business rule fail        |
| Unapproved council creates      | `new=[{...}]`                            | `207`           | Global error: `ALL → 403`           |
| Mixed valid & invalid           | `new=[valid, invalid]`                  | `207`           | Partial success with errors         |

---

### Update & Delete

| **Scenario**                     | **Payload Example**                          | **HTTP Status** | **Notes**                          |
|----------------------------------|----------------------------------------------|------------------|-------------------------------------|
| Update single point (council)   | `updated=[{"point_id":X, "changed_fields":{...}}]` | `207`    | Sub-status `200` in `updated`      |
| Update with bad field name      | `changed_fields={"bogus": ...}`             | `422`           | Schema validation error            |
| Update non-existent point       | `point_id=99999`                            | `207`           | Error entry with `404`             |
| User tries to update            | Any `updated`                               | `403`           | Forbidden                          |
| Delete point (admin/council)    | `deleted=[X]`                               | `207`           | Deletion success (`200`)           |
| User tries to delete            | `deleted=[X]`                               | `207`           | Global error: `ALL → 403`          |
| Delete non-existent point       | `deleted=[99999]`                           | `207`           | Error with `404`                   |

---

### Edge Cases

| **Scenario**                     | **Payload Example**                          | **HTTP Status** | **Notes**                          |
|----------------------------------|----------------------------------------------|------------------|-------------------------------------|
| Empty payload                    | `new=[], updated=[], deleted=[]`           | `207`           | Error: `ALL → 400, Empty payload`   |
| Malformed JSON (missing key)    | No `updated` key                            | `422`           | FastAPI schema error                |
| Mixed create/update/delete       | All valid entries                           | `207`           | Each handled independently          |


### Examples

1. Create a point (council)

`POST /recycling-points`
with
`Authorization: Bearer <council‑token>`
`Content-Type: application/json`

```{python}
{
  "new": [{ … }],
  "updated": [],
  "deleted": []
}
-> 201 Created
{
  "new": [
    { "temp‑1": { "status":201, "result": { /* full point */ } } }
  ],
  "updated": [],
  "deleted": [],
  "errors": []
}
```

2. Update a point (council)

`POST /recycling-points`
with
`Authorization: Bearer <council‑token>`

```{python}
{
  "new": [],
  "updated": [
    { "point_id": 42, "changed_fields": { "latitude": 52.0, "user_id": "…" } }
  ],
  "deleted": []
}
-> 207 Multi‑Status
{
  "new":    [],
  "updated": [
    { "42": { "status":200, "result": { /* updated */ } } }
  ],
  "deleted": [],
  "errors":  []
}
```

3. Delete a point (user)

`POST /recycling-points`
with
`Authorization: Bearer <user‑token>`

```{python}
{ "new": [], "updated": [], "deleted": [42] }
-> 207 Multi‑Status
{
  "new":    [],
  "updated": [],
  "deleted": [],
  "errors": [ { "ALL": { "status":403, "error":"not allowed" } } ]
}
```
