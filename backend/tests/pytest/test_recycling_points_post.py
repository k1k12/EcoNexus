import pytest
from fastapi import status

COMMON_PARAMS_CREATE = [
    ("council_user", "council", status.HTTP_201_CREATED),
    ("user", "user", status.HTTP_403_FORBIDDEN),
    ("unauth_user", "unauth", status.HTTP_403_FORBIDDEN),
]

COMMON_PARAMS_UPDATE = [
    ("override_get_current_user_council", "council_user", "council", status.HTTP_200_OK),
    ("override_get_current_user", "user", "user", status.HTTP_403_FORBIDDEN),
    ("override_get_current_unauth_user", "unauth_user", "unauth", status.HTTP_403_FORBIDDEN),
]

@pytest.mark.asyncio
@pytest.mark.parametrize("user_key, role, expected_status", COMMON_PARAMS_CREATE)
async def test_create_point_various_roles(
    client, seed_dependencies, generate_testing_token,
    user_key, role, expected_status
):
    """
    Test POST /recycling-points new creation for council/user/guest
    """
    user = seed_dependencies[user_key]
    council = seed_dependencies["council"]
    material = seed_dependencies["material"]
    token = generate_testing_token(email=user.email, role=role)

    new_point = {
        "user_id": user.user_id,
        "gss_code": council.gss_code,
        "material_ids": [material.material_id],
        "latitude": 54.5,
        "longitude": -1.5,
        "times_open": { day: ("08:00","17:00") for day in [
            "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
        ]}
    }

    payload = {"new": [new_point], "updated": [], "deleted": []}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == expected_status

    body = resp.json()
    if expected_status == status.HTTP_201_CREATED:
        # one new
        assert len(body["new"]) == 1
        wrapper = body["new"][0]
        result = list(wrapper.values())[0]
        assert result["status"] == 201
        assert result["result"]["latitude"] == pytest.approx(new_point["latitude"])
    else:
        # no new, one error
        assert body["new"] == []
        assert len(body["errors"]) == 1
        err = list(body["errors"][0].values())[0]
        assert err["status"] == 403

@pytest.mark.asyncio
async def test_create_point_missing_fields_returns_422(
    client, seed_dependencies, generate_testing_token
):
    """
    Missing latitude should return 422 validation error
    """
    user = seed_dependencies["council_user"]
    council = seed_dependencies["council"]
    token = generate_testing_token(email=user.email, role="council")

    bad = {
        "user_id": user.user_id,
        "gss_code": council.gss_code,
        # latitude omitted
        "longitude": -1.5,
        "material_ids": [seed_dependencies["material"].material_id],
        "times_open": { day: ("08:00","17:00") for day in [
            "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
        ]}
    }
    resp = await client.post(
        "/recycling-points",
        json={"new": [bad], "updated": [], "deleted": []},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_create_point_invalid_material_id_errors(
    client, seed_dependencies, generate_testing_token
):
    """
    Non-existent material_ids yields business error (400 or 207)
    """
    user = seed_dependencies["council_user"]
    council = seed_dependencies["council"]
    token = generate_testing_token(email=user.email, role="council")

    pt = {
        "user_id": user.user_id,
        "gss_code": council.gss_code,
        "material_ids": [99999],
        "latitude": 54.5,
        "longitude": -1.5,
        "times_open": { day: ("08:00","17:00") for day in [
            "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
        ]}
    }
    resp = await client.post(
        "/recycling-points",
        json={"new": [pt], "updated": [], "deleted": []},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_207_MULTI_STATUS)
    body = resp.json()
    assert body.get("errors")

@pytest.mark.asyncio
async def test_create_duplicate_location_bulk(
    client, seed_dependencies, generate_testing_token
):
    """
    Creating two points at same coords: second yields error
    """
    user = seed_dependencies["council_user"]
    council = seed_dependencies["council"]
    mat = seed_dependencies["material"]
    token = generate_testing_token(email=user.email, role="council")

    common = {
        "user_id": user.user_id,
        "gss_code": council.gss_code,
        "latitude": 54.5,
        "longitude": -1.5,
        "material_ids": [mat.material_id],
        "times_open": { day: ("08:00","17:00") for day in [
            "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
        ]}
    }
    payload = {"new": [common, common], "updated": [], "deleted": []}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS
    body = resp.json()
    assert len(body["new"]) == 1
    assert len(body["errors"]) == 1

@pytest.mark.asyncio
@pytest.mark.parametrize("override_fixture, user_key, role, expected", COMMON_PARAMS_UPDATE)
async def test_update_point_various_roles(
    client, seed_dependencies, generate_testing_token,
    override_fixture, user_key, role, expected, request
):
    """
    Test updating latitude/longitude across roles
    """
    request.getfixturevalue(override_fixture)
    user = seed_dependencies[user_key]
    token = generate_testing_token(email=user.email, role=role)
    point = seed_dependencies["point"]

    changed = {"latitude": point.latitude + 1, "longitude": point.longitude + 1, "user_id": user.user_id}
    payload = {"new": [], "updated": [{"point_id": point.point_id, "changed_fields": changed}], "deleted": []}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS
    body = resp.json()
    if expected == status.HTTP_200_OK:
        assert len(body["updated"]) == 1
        res = list(body["updated"][0].values())[0]
        assert res["status"] == 200
        assert res["result"]["latitude"] == pytest.approx(changed["latitude"])
    else:
        assert body["updated"] == []
        err = list(body["errors"][0].values())[0]
        assert err["status"] == 403

###################### DELETE #######################

@pytest.mark.asyncio
async def test_delete_single_success_council(client, seed_dependencies, generate_testing_token):
    """
    A council user may delete their own point:
      - Expect 207 Multi-Status, one entry in 'deleted' with status 200
    """
    user = seed_dependencies["council_user"]
    point = seed_dependencies["point"]
    token = generate_testing_token(email=user.email, role="council")

    payload = {"new": [], "updated": [], "deleted": [point.point_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert len(body["deleted"]) == 1
    deleted_id, result = next(iter(body["deleted"][0].items()))
    assert int(deleted_id) == point.point_id
    assert result["status"] == 200
    assert result["error"] is None
    assert body["errors"] == []

@pytest.mark.asyncio
async def test_delete_single_success_admin(client, seed_dependencies, generate_testing_token):
    """
    An admin may delete any point:
      - Expect 207 Multi-Status, one deletion entry with status 200
    """
    admin = seed_dependencies["admin_user"]
    point = seed_dependencies["point2"]
    token = generate_testing_token(email=admin.email, role="admin")

    payload = {"new": [], "updated": [], "deleted": [point.point_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    deleted_id, result = next(iter(body["deleted"][0].items()))
    assert int(deleted_id) == point.point_id
    assert result["status"] == 200
    assert result["error"] is None
    assert body["errors"] == []

@pytest.mark.asyncio
async def test_delete_single_no_permission_user(client, seed_dependencies, generate_testing_token):
    """
    A plain user may not delete any points:
      - Expect 207 Multi-Status, no deletions and a global 403 error
    """
    user = seed_dependencies["user"]
    point = seed_dependencies["point"]
    token = generate_testing_token(email=user.email, role="user")

    payload = {"new": [], "updated": [], "deleted": [point.point_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert body["deleted"] == []
    assert len(body["errors"]) == 1
    err_key, err = next(iter(body["errors"][0].items()))
    assert err_key == "ALL"
    assert err["status"] == 403
    assert "not allowed" in err["error"].lower()

@pytest.mark.asyncio
async def test_delete_nonexistent_point(client, seed_dependencies, generate_testing_token):
    """
    Deleting a non-existent point → 207 with a 404 in 'errors'
    """
    admin = seed_dependencies["admin_user"]
    fake_id = 999_999
    token = generate_testing_token(email=admin.email, role="admin")

    payload = {"new": [], "updated": [], "deleted": [fake_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert body["deleted"] == []
    assert len(body["errors"]) == 1
    err_id, err = next(iter(body["errors"][0].items()))
    assert int(err_id) == fake_id
    assert err["status"] == 404
    assert "not found" in err["error"].lower()

@pytest.mark.asyncio
async def test_delete_bulk_mixed_validity(client, seed_dependencies, generate_testing_token):
    """
    Bulk delete: one real, one fake → expect exactly one success and one 404 error.
    """
    council = seed_dependencies["council_user"]
    real = seed_dependencies["point"]
    fake = 123_456
    token = generate_testing_token(email=council.email, role="council")

    payload = {"new": [], "updated": [], "deleted": [real.point_id, fake]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    # one success
    assert len(body["deleted"]) == 1
    did, res = next(iter(body["deleted"][0].items()))
    assert int(did) == real.point_id
    assert res["status"] == 200
    # one error
    assert len(body["errors"]) == 1
    eid, eres = next(iter(body["errors"][0].items()))
    assert int(eid) == fake
    assert eres["status"] == 404

@pytest.mark.asyncio
async def test_delete_empty_payload_returns_error(client, seed_dependencies, generate_testing_token):
    """
    All lists empty → global 400 under 'ALL'
    """
    council = seed_dependencies["council_user"]
    token = generate_testing_token(email=council.email, role="council")

    payload = {"new": [], "updated": [], "deleted": []}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert body["deleted"] == []
    assert body["updated"] == []
    assert len(body["errors"]) == 1
    key, err = next(iter(body["errors"][0].items()))
    assert key == "ALL"
    assert err["status"] == 400
    assert "empty payload" in err["error"].lower()

@pytest.mark.asyncio
async def test_delete_unapproved_council_forbidden(client, seed_dependencies, generate_testing_token):
    """
    Unapproved council cannot delete → global 403 under 'ALL'
    """
    user = seed_dependencies["council_user2"]
    assert not seed_dependencies["admin_entry2"].is_approved
    point = seed_dependencies["point"]
    token = generate_testing_token(email=user.email, role="council")

    payload = {"new": [], "updated": [], "deleted": [point.point_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert body["deleted"] == []
    assert len(body["errors"]) == 1
    key, err = next(iter(body["errors"][0].items()))
    assert key == "ALL"
    assert err["status"] == 403
    assert "not approved" in err["error"].lower()

@pytest.mark.asyncio
async def test_delete_malformed_payload_non_int_id(client, seed_dependencies, generate_testing_token):
    """
    Non-integer in 'deleted' list → 422 Unprocessable Entity
    """
    council = seed_dependencies["council_user"]
    token = generate_testing_token(email=council.email, role="council")

    payload = {"new": [], "updated": [], "deleted": ["abc"]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = resp.json().get("detail")
    assert detail and detail[0]["loc"][:2] == ["body", "deleted"]

@pytest.mark.asyncio
async def test_delete_no_op_empty_list(client, seed_dependencies, generate_testing_token):
    """
    Re-sending empty delete list → 207 with a global 'no operations provided' error.
    """
    council = seed_dependencies["council_user"]
    token = generate_testing_token(email=council.email, role="council")

    payload = {"new": [], "updated": [], "deleted": []}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS
    body = resp.json()
    key, err = next(iter(body["errors"][0].items()))
    assert key == "ALL"
    assert err["status"] == 400
    assert "no operations provided" in err["error"].lower()

@pytest.mark.asyncio
async def test_delete_duplicate_ids(client, seed_dependencies, generate_testing_token):
    """
    Deleting same ID twice → two successes, no errors.
    """
    council = seed_dependencies["council_user"]
    point = seed_dependencies["point"]
    token = generate_testing_token(email=council.email, role="council")

    payload = {"new": [], "updated": [], "deleted": [point.point_id, point.point_id]}
    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS

    body = resp.json()
    assert len(body["deleted"]) == 2
    for entry in body["deleted"]:
        did, res = next(iter(entry.items()))
        assert int(did) == point.point_id
        assert res["status"] == 200
        assert res["error"] is None
    assert body["errors"] == []

###################### MIXED CREATE/UPDATE/DELETE #######################

@pytest.mark.asyncio
async def test_mixed_create_update_delete(client, seed_dependencies, generate_testing_token):
    """
    One new, one update, one delete in the same payload → 207 with each in its section.
    """
    council = seed_dependencies["council_user"]
    token = generate_testing_token(email=council.email, role="council")
    p1 = seed_dependencies["point"]
    p2 = seed_dependencies["point2"]
    mat = seed_dependencies["material"]

    new_point = {
        "user_id": council.user_id,
        "gss_code": council.gss_code,
        "material_ids": [mat.material_id],
        "latitude": p1.latitude + 0.1,
        "longitude": p1.longitude + 0.1,
        "times_open": { day: ("09:00","18:00") for day in [
            "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
        ] }
    }
    update_fields = {"latitude": p1.latitude + 1, "user_id": council.user_id}
    payload = {
        "new": [new_point],
        "updated": [{"point_id": p1.point_id, "changed_fields": update_fields}],
        "deleted": [p2.point_id],
    }

    resp = await client.post(
        "/recycling-points",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == status.HTTP_207_MULTI_STATUS
    body = resp.json()

    # new
    assert len(body["new"]) == 1
    assert next(iter(body["new"][0].values()))["status"] == 201

    # updated
    updated = body["updated"][0]
    assert list(updated.keys())[0] == str(p1.point_id)
    assert updated[str(p1.point_id)]["status"] == 200

    # deleted
    deleted = body["deleted"][0]
    assert list(deleted.keys())[0] == str(p2.point_id)
    assert deleted[str(p2.point_id)]["status"] == 200

    # no errors
    assert body["errors"] == []
