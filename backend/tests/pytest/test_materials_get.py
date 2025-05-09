import pytest
from app.schemas.materials import Material
from fastapi import status

@pytest.mark.asyncio
async def test_get_materials_success(client, seed_dependencies, generate_testing_token):
    # Given some materials in the DB via seed_dependencies
    user = seed_dependencies["user"]
    token = generate_testing_token(email=user.email, role="user")

    # When I fetch GET /materials
    response = await client.get(
        "/materials",
        headers={"Authorization": f"Bearer {token}"}
    )

    # Then I get 200 OK
    assert response.status_code == status.HTTP_200_OK

    # And the body is a JSON list of materials
    data = response.json()
    assert isinstance(data, list), "Expected a top-level list of materials"

    # And each element validates against our Pydantic schema
    for item in data:
        mat = Material.model_validate(item)
        assert isinstance(mat, Material)
