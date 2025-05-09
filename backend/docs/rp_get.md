# GET `/recycling-points` 

This document describes in detail how the GET `/recycling-points` endpoint behaves, how the test suite operates, and what to expect for every possible combination of inputs and outputs.

---

## JWT

| Header                        | Outcome                |
|-------------------------------|------------------------|
| **Missing**                   | `401 Unauthorized`     |
| **Malformed / invalid token** | `401 Unauthorized`     |
| **Well‑formed JWT**           | Proceeds               |

---

## Parameters & Branching Logic

### 1. `point_id`
- Must be an integer.
- Returns exactly one object or 404 Not Found if no such point.

### 2. `gss_code`
- Returns all points matching that council code.
- Even if gss_code= (empty string), counts as “has council” -> valid -> 200 OK + [].

### 3. Bounding box
- Use all four: `min_lat, max_lat, min_lon, max_lon`
- Edges are inclusive.
- Non‑numeric coordinate -> 422 Unprocessable Entity.
- min_lat > max_lat or min_lon > max_lon -> 400 Bad Request.
- Otherwise 200 OK + list of points inside (possibly empty).

### 4. Nearby search
- Requires both `near_lat` (–90…90) and `near_lon` (–180…180).
- `radius_km` defaults to 5.0, must be > 0 -> else 422.
- Returns points within radius, capped to `max_results` (1…20 -> else 422).
- Omitting `radius_km` -> radius = 5 km.
- Supplying only one of `near_lat` or `near_lon` -> 400 Bad Request.
- Out‑of‑bounds `lat`/`lon` -> 422 Unprocessable Entity.
- Success -> 200 OK + list (possibly empty).
- Sorting: nearest first.

### 5. Material‑optimal search
- Use `material_ids` repeated in query (e.g. ?material_ids=1&material_ids=2).
- IDs must be integers -> else 422.
-> `max_result`s applies here too.

### Branching priority:
1. If material_ids present, run material filter.
2. If also near_lat+near_lon, then rerun a radius search on those filtered points and apply limit.
3. No matching points -> 404 Not Found.

Otherwise -> 200 OK + list sorted by distance.

## Common Response Shapes

### 1. Single Point Object (`200 OK`)
```{python}
{
  "point_id":       123,
  "user_id":        456,
  "gss_code":      "E09000001",
  "latitude":      51.5074,
  "longitude":     -0.1278,
  "times_open": {
    "monday":    ["09:00","17:00"],
    "tuesday":   ["09:00","17:00"],
    "wednesday": ["09:00","17:00"],
    "thursday":  ["09:00","17:00"],
    "friday":    ["09:00","17:00"],
    "saturday":  ["10:00","14:00"],
    "sunday":    ["10:00","14:00"]
  },
  "material_ids": [1, 2, 3]
}
```

### 2. List of Points (`200 OK`)

```{python}
[
  { /* point object as above */ },
  { /* another point */ },
]
```

### 3. Empty List (`200 OK`)

```{python}
[]
```

### 4. Error Object

```{python}
{ "detail": "<human‑readable error message>" }
```

### Invalid combinations

- Missing all filters or partial bbox or mixing of two main branches -> 400 Bad Request.

### TLDR:

| **Scenario**                                          | **Status Code**           |
|-------------------------------------------------------|---------------------------|
| Success (single point or list)                        | 200 OK                    |
| No match for `point_id`                               | 404 Not Found             |
| Material search yields no points                      | 404 Not Found             |
| Zero or conflicting filters                           | 400 Bad Request           |
| Incomplete nearby pair (`near_lat` or `near_lon`)     | 400 Bad Request           |
| BBox `min > max`                                      | 400 Bad Request           |
| Missing auth / invalid JWT                            | 401 Unauthorised          |
| Non‑numeric or out‑of‑range params                    | 422 Unprocessable Entity  |

## Examples

-> Fetch point 42
`GET /recycling-points?point_id=42` -> 200 OK + single JSON object.

-> Fetch council “E09000001”
`GET /recycling-points?gss_code=E09000001` -> 200 OK + array of points.

-> Bounding box around London
`GET /recycling-points?min_lat=51.5&max_lat=51.6&min_lon=-0.2&max_lon=0.1` -> 200 OK + list.

-> Nearby search
`GET /recycling-points?near_lat=51.5&near_lon=-0.1&radius_km=2&max_results=5` -> 200 OK + up to 5 closest.

-> Material search
`GET /recycling-points?material_ids=3&material_ids=7&max_results=10` -> 200 OK + up to 10 points accepting materials 3 & 7.

-> Material + Nearby
`GET /recycling-points?material_ids=3&near_lat=51.5&near_lon=-0.1&radius_km=5&max_results=5`
-> First filters by material 3, then applies nearby radius & cap.

-> Invalid partial bbox
`GET /recycling-points?min_lat=51.5&min_lon=-0.1` -> 400 Bad Request.

-> Unknown key
`GET /recycling-points?foo=bar` -> 400 Bad Request.

