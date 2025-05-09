import pytest
from fastapi import status
import pytest_asyncio


@pytest.mark.asyncio
async def test_get_all_councils_success(client, seed_dependencies, generate_testing_token):
    # Given some councils in the DB via seed_dependencies
    user = seed_dependencies["council_user"]
    token = generate_testing_token(email=user.email, role="council")

    # When I fetch GET /councils
    response = await client.get(
        "/all-councils",
        headers={"Authorization": f"Bearer {token}"}
    )

    # Then I get 200 OK
    assert response.status_code == 200, "Expected 200 OK response"

    # And the body is a JSON list of councils
    data = response.json()
    assert isinstance(data, list), "Ensure the response is a list"
    print("passed")

    # And the list is not empty
    assert len(data) > 0, "Expected at least one council in the response"

    # And each element validates against our Pydantic schema
    for item in data:
        assert isinstance(item, dict), "Expected each item to be a dictionary"
        
        # assert needed fields are present
        assert "gss_code" in item, "Expected each council to have an 'id' field"
        assert "name" in item, "Expected each council to have a 'name' field"
        assert "lon_lat_points" in item, "Expected each council to have a 'lon_lat_points' field"
