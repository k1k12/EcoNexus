import pytest
from fastapi import status

@pytest.mark.asyncio
async def test_recycle_post_success(client, seed_dependencies, generate_testing_token):
    # Given a valid payload and a user with the correct role
    payload = {
        "recycling_point_id": 5,
        "product_quantities": {
            "5012345678917": 1
                }
    }

    user = seed_dependencies["user"]
    token = generate_testing_token(email=user.email, role="user")

    # When I send a POST request to /recycle
    response = await client.post(
        "/recycle",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # Then I get a 200 OK response
    assert response.status_code == status.HTTP_200_OK, "Expected 200 OK response"

    # And the body is a JSON object with the expected fields
    data = response.json()
    assert isinstance(data, dict), "Expected the response to be a dictionary"
    assert "message" in data, "Expected 'barcode' in the response"
    assert "history" in data, "Expected 'history' in the response"


@pytest.mark.asyncio
async def test_recycle_post_invalid_payload_1(client, seed_dependencies, generate_testing_token):
    # Given an invalid payload (missing recycling_point_id)
    payload = {
        "product_quantities": {
            "5012345678917": 1
        }
    }

    user = seed_dependencies["user"]
    token = generate_testing_token(email=user.email, role="user")

    # When I send a POST request to /recycle
    response = await client.post(
        "/recycle",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # Then I get a 422 Unprocessable Entity response
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, "Expected 422 Unprocessable Entity response"
    assert response.json() == {"detail": "Recycling point ID is required."}, "Expected error message for missing recycling point ID"

@pytest.mark.asyncio
async def test_recycle_post_invalid_payload_2(client, seed_dependencies, generate_testing_token):
    # Given an invalid payload (missing product_quantities)
    payload = {
        "recycling_point_id": 5
    }

    user = seed_dependencies["user"]
    token = generate_testing_token(email=user.email, role="user")

    # When I send a POST request to /recycle
    response = await client.post(
        "/recycle",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # Then I get a 422 Unprocessable Entity response
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, "Expected 422 Unprocessable Entity response"
    assert "detail" in response.json(), "Expected error message for missing product quantities"
