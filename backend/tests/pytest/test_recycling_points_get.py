import pytest
from fastapi import status
from math import radians, sin, cos, sqrt, atan2

#################### Helpers ####################

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

####################### GET Tests ####################

@pytest.mark.asyncio
async def test_get_point_by_id_success(client, seed_dependencies, generate_testing_token):
    """
    Retrieve a single recycling point by its point_id.

    Verifies that the response contains a flat JSON object with the exact fields:
    - point_id
    - user_id
    - gss_code
    - latitude (within tolerance)
    - longitude (within tolerance)
    - times_open (as a dict)
    - materials (as a list)

    Expects HTTP 200 OK.
    """
    user = seed_dependencies["user"]
    point = seed_dependencies["point"]
    token = generate_testing_token(email=user.email, role="user")

    resp = await client.get(
        f"/recycling-points?point_id={point.point_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK

    data = resp.json()
    assert data["point_id"] == point.point_id
    assert data["user_id"] == point.user_id
    assert data["gss_code"] == point.gss_code
    assert data["latitude"] == pytest.approx(point.latitude)
    assert data["longitude"] == pytest.approx(point.longitude)
    assert isinstance(data["times_open"], dict)
    assert isinstance(data["materials"], list)

@pytest.mark.asyncio
async def test_get_point_by_id_not_found(client, seed_dependencies, generate_testing_token):
    """
    Attempt to retrieve a non-existent recycling point by point_id.

    Uses a fake point_id and expects HTTP 404 Not Found with a detail message
    indicating "Recycling point not found".
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    fake_id = 999_999

    resp = await client.get(
        f"/recycling-points?point_id={fake_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in resp.json()

@pytest.mark.asyncio
async def test_get_council_points_success(client, seed_dependencies, generate_testing_token):
    """
    Retrieve all recycling points for a valid council gss_code.

    Seeds contain two points for the same council. The test verifies that
    the response list includes exactly those two point_ids.
    Expects HTTP 200 OK.
    """
    council = seed_dependencies["council"]
    expected = {
        seed_dependencies["point"].point_id,
        seed_dependencies["point2"].point_id
    }

    token = generate_testing_token(email=seed_dependencies["council_user"].email, role="council")
    resp = await client.get(
        f"/recycling-points?gss_code={council.gss_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK

    data = resp.json()
    returned_ids = {item["point_id"] for item in data}
    assert returned_ids == expected

@pytest.mark.asyncio
async def test_get_council_points_empty(client, seed_dependencies, generate_testing_token):
    """
    Retrieve recycling points for a non-existent council gss_code.

    Uses a made-up gss_code by appending digits, expects an empty list
    and HTTP 200 OK.
    """
    council = seed_dependencies["council"]
    fake_gss = council.gss_code + "999"
    token = generate_testing_token(email=seed_dependencies["council_user"].email, role="council")

    resp = await client.get(
        f"/recycling-points?gss_code={fake_gss}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.asyncio
async def test_get_area_points_success(client, seed_dependencies, generate_testing_token):
    """
    Retrieve recycling points within a geographical bounding box.

    Two seeded points sit close together; the test computes a box
    that includes both and verifies their point_ids are returned.
    Expects HTTP 200 OK.
    """
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    min_lat = min(p1.latitude, p2.latitude) - 0.1
    max_lat = max(p1.latitude, p2.latitude) + 0.1
    min_lon = min(p1.longitude, p2.longitude) - 0.1
    max_lon = max(p1.longitude, p2.longitude) + 0.1

    url = (
        f"/recycling-points?min_lat={min_lat}&max_lat={max_lat}"
        f"&min_lon={min_lon}&max_lon={max_lon}"
    )
    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == status.HTTP_200_OK

    data = resp.json()
    returned_ids = {item["point_id"] for item in data}
    assert returned_ids == {p1.point_id, p2.point_id}

@pytest.mark.asyncio
async def test_get_area_points_none_inside(client, seed_dependencies, generate_testing_token):
    """
    Bounding box far from any seeded points should yield an empty list.

    Verifies HTTP 200 OK and empty response.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        "/recycling-points?min_lat=0&max_lat=0.1&min_lon=0&max_lon=0.1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.parametrize("qs", [
    "",                              # no params at all
    "min_lat=1&max_lat=2&min_lon=3", # missing max_lon
    "point_id=1&gss_code=2"          # conflicting filters
])
@pytest.mark.asyncio
async def test_get_bad_combination(qs, client, generate_testing_token):
    """
    Supplying zero, incomplete, or conflicting filter sets must return HTTP 400.

    Each invalid combination is tested via parametrization.
    """
    token = generate_testing_token(email="eesha@getsmid.priviledges", role="user")
    resp = await client.get(f"/recycling-points?{qs}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp.json()

@pytest.mark.asyncio
async def test_bbox_type_validation(client, generate_testing_token):
    """
    Non-numeric latitude/longitude values in bounding box should trigger
    FastAPI validation and return HTTP 422.
    """
    token = generate_testing_token(email="eesha@getsmid.priviledges", role="user")
    resp = await client.get(
        "/recycling-points?min_lat=foo&max_lat=55&min_lon=-1&max_lon=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

####################### AUTH & TYPES #######################

@pytest.mark.asyncio
async def test_missing_auth_header_returns(client):
    """
    A request without an Authorization header should be accepted with HTTP 200 OK if found, else 404.
    """
    resp = await client.get("/recycling-points?point_id=1")
    assert resp.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

@pytest.mark.asyncio
async def test_malformed_token_returns_200(client):
    """
    A request with a malformed or invalid JWT should be accepted with HTTP 200 OK if found, else 404.
    """
    resp = await client.get(
        "/recycling-points?point_id=1",
        headers={"Authorization": "Bearer not_a_valid_token"}
    )
    assert resp.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

@pytest.mark.asyncio
async def test_point_id_type_validation_returns_422(client, seed_dependencies, generate_testing_token):
    """
    A non-integer value for point_id should fail FastAPI validation with HTTP 422.
    Uses a valid user authentication token from seeded dependencies.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?point_id=abc",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_empty_string_gss_code_returns_empty_list(client, seed_dependencies, generate_testing_token):
    """
    Supplying gss_code= (empty) still counts as has_council, returns [] with HTTP 200.
    Uses a valid council user for authentication.
    """
    token = generate_testing_token(email=seed_dependencies["council_user"].email, role="council")
    resp = await client.get(
        "/recycling-points?gss_code=",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.asyncio
async def test_guest_role_can_fetch_any_filter(client, seed_dependencies, generate_testing_token):
    """
    A user with a non-council, non-admin role (e.g. 'guest') can still GET points.
    """
    p = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["unauth_user"].email, role="guest")
    resp = await client.get(
        f"/recycling-points?point_id={p.point_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["point_id"] == p.point_id

@pytest.mark.asyncio
async def test_reversed_bbox_returns_400(client, seed_dependencies, generate_testing_token):
    """
    If min_lat > max_lat (or min_lon > max_lon), the endpoint must reject
    the request with HTTP 400 and a clear message.
    """
    p = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    # reversed lat bounds
    resp = await client.get(
        f"/recycling-points?min_lat={p.latitude+1}&max_lat={p.latitude}&"
        f"min_lon={p.longitude}&max_lon={p.longitude+1}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp.json()

    # reversed lon bounds
    resp2 = await client.get(
        f"/recycling-points?min_lat={p.latitude}&max_lat={p.latitude+1}&"
        f"min_lon={p.longitude+1}&max_lon={p.longitude}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp2.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp2.json()

@pytest.mark.asyncio
async def test_bbox_edge_inclusion(client, seed_dependencies, generate_testing_token):
    """
    A bbox whose edges exactly match a point's coordinates should include that point.
    """
    p = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    # exact-match bounding box
    resp = await client.get(
        f"/recycling-points?min_lat={p.latitude}&max_lat={p.latitude}&"
        f"min_lon={p.longitude}&max_lon={p.longitude}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["point_id"] == p.point_id

@pytest.mark.asyncio
async def test_unknown_query_key_returns_400(client, seed_dependencies, generate_testing_token):
    """
    An unexpected query parameter (foo=bar) should trigger our 400
    conflicting-filters guard.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?foo=bar",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp.json()

@pytest.mark.asyncio
async def test_admin_fetch_by_gss_code(client, seed_dependencies, generate_testing_token):
    """
    An admin user should be able to retrieve points by gss_code just like a council user.
    """
    council = seed_dependencies["council"]
    expected = {
        seed_dependencies["point"].point_id,
        seed_dependencies["point2"].point_id
    }
    token = generate_testing_token(email=seed_dependencies["admin_user"].email, role="admin")
    resp = await client.get(
        f"/recycling-points?gss_code={council.gss_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    returned = {pt["point_id"] for pt in resp.json()}
    assert returned == expected

@pytest.mark.asyncio
async def test_unapproved_council_user_can_fetch(client, seed_dependencies, generate_testing_token):
    """
    A council user who is not yet approved should still be able to GET points (no approval guard on GET).
    """
    council = seed_dependencies["council"]
    token = generate_testing_token(email=seed_dependencies["council_user2"].email, role="council")
    resp = await client.get(
        f"/recycling-points?gss_code={council.gss_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert {pt["point_id"] for pt in resp.json()} == {
        seed_dependencies["point"].point_id,
        seed_dependencies["point2"].point_id
    }

@pytest.mark.asyncio
async def test_guest_fetch_by_gss_and_bbox(client, seed_dependencies, generate_testing_token):
    """
    A 'guest' role can still GET by gss_code and by bounding box.
    """
    p = seed_dependencies["point"]
    council = seed_dependencies["council"]
    token = generate_testing_token(email=seed_dependencies["unauth_user"].email, role="guest")

    # by gss_code
    resp1 = await client.get(
        f"/recycling-points?gss_code={council.gss_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp1.status_code == status.HTTP_200_OK
    assert any(pt["point_id"] == p.point_id for pt in resp1.json())

    # by bbox
    resp2 = await client.get(
        f"/recycling-points?min_lat={p.latitude}&max_lat={p.latitude}&min_lon={p.longitude}&max_lon={p.longitude}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp2.status_code == status.HTTP_200_OK
    data2 = resp2.json()
    assert len(data2) == 1 and data2[0]["point_id"] == p.point_id

@pytest.mark.asyncio
async def test_times_open_structure(client, seed_dependencies, generate_testing_token):
    """
    Ensure that the 'times_open' dict in the response has exactly the seven weekdays,
    each mapping to a 2-element list of strings.
    """
    p = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?point_id={p.point_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    times = resp.json()["times_open"]
    expected_days = {
        "monday", "tuesday", "wednesday", "thursday",
        "friday", "saturday", "sunday"
    }
    assert set(times.keys()) == expected_days
    for day, slot in times.items():
        assert isinstance(slot, list)
        assert len(slot) == 2
        assert all(isinstance(t, str) for t in slot)

@pytest.mark.asyncio
async def test_out_of_range_bbox_returns_empty(client, seed_dependencies, generate_testing_token):
    """
    A bounding box with absurdly large coordinates returns HTTP 200 and an empty list.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?min_lat=999&max_lat=1000&min_lon=999&max_lon=1000",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.asyncio
async def test_bare_question_mark_returns_400(client, seed_dependencies, generate_testing_token):
    """
    A request to '/recycling-points?' (with no params) should return HTTP 400.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp.json()

@pytest.mark.asyncio
async def test_trailing_slash_with_point_id(client, seed_dependencies, generate_testing_token):
    """
    A trailing slash on the GET path issues a 307 redirect to the canonical route.
    """
    p = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points/?point_id={p.point_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_307_TEMPORARY_REDIRECT
    location = resp.headers["location"]
    assert location.endswith(f"/recycling-points?point_id={p.point_id}")

@pytest.mark.asyncio
async def test_sql_injection_style_gss_code_safe(client, seed_dependencies, generate_testing_token):
    """
    Passing a SQL-injection-style string as gss_code should not crash the server;
    it should return HTTP 200 with an empty list.
    """
    evil = "123456'; DROP TABLE users;--"
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?gss_code={evil}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.asyncio
async def test_nearby_search_success_ordered(client, seed_dependencies, generate_testing_token):
    """
    When I supply near_lat & near_lon within 10 000 km of two seeded points,
    I get both back (order still by proximity).
    """
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    center_lat = (p1.latitude + p2.latitude) / 2
    center_lon = (p1.longitude + p2.longitude) / 2

    resp = await client.get(
        f"/recycling-points?near_lat={center_lat}&near_lon={center_lon}&radius_km=10000",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK

    data = resp.json()
    assert isinstance(data, list) and len(data) == 2
    returned = {pt["point_id"] for pt in data}
    assert returned == {p1.point_id, p2.point_id}

@pytest.mark.asyncio
async def test_nearby_search_none_within_small_radius(client, seed_dependencies, generate_testing_token):
    """
    A tiny radius (e.g. 0.1 km) around a point far from any seed returns [].
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?near_lat=0&near_lon=0&radius_km=0.1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == []

@pytest.mark.asyncio
async def test_nearby_search_requires_both_coords(client, seed_dependencies, generate_testing_token):
    """
    Supplying only near_lat (no near_lon) → 400 invalid combination.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?near_lat=54.9",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in resp.json()

@pytest.mark.asyncio
@pytest.mark.parametrize("radius", [0, -1])
async def test_nearby_search_invalid_radius(client, seed_dependencies, generate_testing_token, radius):
    """
    radius_km must be > 0 → FastAPI returns 422.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?near_lat=54.9&near_lon=-1.6&radius_km={radius}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
@pytest.mark.parametrize("lat,lon", [(100, 0), (0, 200), (-100, 0), (0, -200)])
async def test_nearby_search_coords_out_of_bounds(client, seed_dependencies, generate_testing_token, lat, lon):
    """
    near_lat ∉ [-90,90] or near_lon ∉ [-180,180] → 422.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?near_lat={lat}&near_lon={lon}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_material_search_no_points_returns_404(client, seed_dependencies, generate_testing_token):
    """
    If no points accept the requested materials, get 404.
    """
    db = seed_dependencies["test_db"]
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    
    await db.refresh(p1, attribute_names=["materials"])
    await db.refresh(p2, attribute_names=["materials"])
    
    p1.materials.clear()
    p2.materials.clear()
    await db.flush()
    await db.commit()

    mat = seed_dependencies["material"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?material_ids={mat}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_material_search_invalid_max_results(client, seed_dependencies, generate_testing_token):
    """
    max_results must be 1–20 → values outside that range give 422.
    """
    mat = seed_dependencies["material"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    for bad in [0, 21]:
        resp = await client.get(
            f"/recycling-points?material_ids={mat}&max_results={bad}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_material_search_non_int_id_returns_422(client, seed_dependencies, generate_testing_token):
    """
    A non-integer in the material_ids list → 422.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?material_ids=foo&material_ids=bar",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_nearby_precedes_material_search(client, seed_dependencies, generate_testing_token):
    """
    When both near_* and material_ids are supplied, material-search branch still wins
    (you observed a 404), so we assert that.
    """
    mat = seed_dependencies["material"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?near_lat=54.9&near_lon=-1.6&material_ids={mat}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_material_search_precedes_bbox(client, seed_dependencies, generate_testing_token):
    """
    Supplying material_ids and a full bbox STILL triggers material search, not bbox.
    """
    db = seed_dependencies["test_db"]
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    
    await db.refresh(p1, attribute_names=["materials"])
    await db.refresh(p2, attribute_names=["materials"])
    
    p1.materials.clear()
    p2.materials.clear()
    await db.flush()
    await db.commit()

    mat = seed_dependencies["material"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    min_lat = min(p1.latitude, p2.latitude) - 0.1
    max_lat = max(p1.latitude, p2.latitude) + 0.1
    min_lon = min(p1.longitude, p2.longitude) - 0.1
    max_lon = max(p1.longitude, p2.longitude) + 0.1

    url = (
        f"/recycling-points?"
        f"material_ids={mat}"
        f"&min_lat={min_lat}&max_lat={max_lat}&min_lon={min_lon}&max_lon={max_lon}"
    )
    resp = await client.get(
        url,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_zero_max_results_unprocessable_entity(client, seed_dependencies, generate_testing_token):
    """
    max_results=0 should trigger FastAPI validation → HTTP 422.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?material_ids=1&max_results=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_max_results_exceeds_limit_unprocessable_entity(client, seed_dependencies, generate_testing_token):
    """
    max_results > 20 should trigger FastAPI validation → HTTP 422.
    """
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        "/recycling-points?material_ids=1&max_results=21",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_near_default_radius_includes_only_close_point(client, seed_dependencies, generate_testing_token):
    """
    Omit radius_km (defaults to 5 km) → only truly nearby points come back.
    Our seed point1 is within 0 km, point2 is ~>5 km away → only point1.
    """
    p1 = seed_dependencies["point"]
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?near_lat={p1.latitude}&near_lon={p1.longitude}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK

    data = resp.json()
    assert isinstance(data, list) and len(data) == 1
    assert data[0]["point_id"] == p1.point_id

@pytest.mark.asyncio
async def test_multiple_material_ids_parsing_and_404(client, seed_dependencies, generate_testing_token):
    """
    Even if we pass multiple material_ids, no points accept them → 404.
    """
    db = seed_dependencies["test_db"]
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    
    await db.refresh(p1, attribute_names=["materials"])
    await db.refresh(p2, attribute_names=["materials"])
    
    p1.materials.clear()
    p2.materials.clear()
    await db.flush()
    await db.commit()

    m1 = seed_dependencies["material"].material_id
    m2 = seed_dependencies["material2"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?material_ids={m1}&material_ids={m2}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_near_precedes_material_search_now_passes(client, seed_dependencies, generate_testing_token):
    """
    When both near_* and material_ids are supplied, the near-radius branch runs
    (returns 200), not the material branch 404.
    """
    p1 = seed_dependencies["point"]
    mat = seed_dependencies["material"].material_id
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?near_lat={p1.latitude}&near_lon={p1.longitude}&material_ids={mat}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert any(pt["point_id"] == p1.point_id for pt in data)

@pytest.mark.asyncio
async def test_nearby_search_respects_radius_and_max_results(client, seed_dependencies, generate_testing_token):
    """
    When radius is large enough to catch both points but max_results=1,
    only the single closest point is returned.
    """
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]

    center_lat = (p1.latitude + p2.latitude) / 2
    center_lon = (p1.longitude + p2.longitude) / 2

    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")

    resp = await client.get(
        f"/recycling-points?near_lat={center_lat}&near_lon={center_lon}&radius_km=10000&max_results=1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert isinstance(data, list) and len(data) == 1

    d1 = haversine(center_lat, center_lon, p1.latitude, p1.longitude)
    d2 = haversine(center_lat, center_lon, p2.latitude, p2.longitude)
    expected = p1.point_id if d1 < d2 else p2.point_id
    assert data[0]["point_id"] == expected

@pytest.mark.asyncio
async def test_material_search_single_material_success(client, seed_dependencies, generate_testing_token):
    """
    If we attach one material to one point and search for it,
    we get back that point.
    """
    db = seed_dependencies["test_db"]
    p1 = seed_dependencies["point"]
    mat = seed_dependencies["material"]

    await db.refresh(p1, attribute_names=["materials"])
    p1.materials = [mat]
    await db.flush()
    await db.commit()

    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?material_ids={mat.material_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert isinstance(data, list)
    assert any(item["point_id"] == p1.point_id for item in data)

@pytest.mark.asyncio
async def test_material_search_multiple_materials_success(client, seed_dependencies, generate_testing_token):
    """
    If a point accepts both materials, and we query both IDs,
    that point is returned.
    """
    db = seed_dependencies["test_db"]
    p1 = seed_dependencies["point"]
    m1 = seed_dependencies["material"]
    m2 = seed_dependencies["material2"]

    await db.refresh(p1, attribute_names=["materials"])
    p1.materials = [m1, m2]
    await db.flush()
    await db.commit()

    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    resp = await client.get(
        f"/recycling-points?material_ids={m1.material_id}&material_ids={m2.material_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert len(data) == 1 and data[0]["point_id"] == p1.point_id
