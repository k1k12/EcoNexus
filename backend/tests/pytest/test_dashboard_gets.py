import pytest
from fastapi import status
import app.schemas.dashboards as dashSchemas

@pytest.mark.asyncio
async def test_user_dashboard_success(client, seed_dependencies, generate_testing_token):
    user = seed_dependencies["user"]
    token = generate_testing_token(email=user.email, role="user")
    # when I send a GET request to /dashboard
    response = await client.get(
        "/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    # then I get a 200 OK response
    assert response.status_code == status.HTTP_200_OK, "Expected 200 OK response"
    
    # and the body is a JSON object with the expected fields
    data = response.json()
    assert isinstance(data, dict), "Expected the response to be a dictionary"
    assert "type" in data, "Expected 'type' in the response"
    assert data["type"] == "user", "Expected 'type' to be 'user'"
    assert "progress" in data, "Expected 'progress' in the response"
    assert "items_per_day_over_last_week" in data["progress"], "Expected 'items_per_day_over_last_week' in the response"
    assert "improvement_over_last_week" in data["progress"], "Expected 'improvement_over_last_week' in the response"
    assert "average_items_per_week_over_last_month" in data["progress"], "Expected 'average_items_per_week_over_last_month' in the response"
    assert "environmental_impact" in data, "Expected 'environmental_impact' in the response"
    assert "turtles_saved" in data["environmental_impact"], "Expected 'turtles_saved' in the response"
    assert "trees_saved" in data["environmental_impact"], "Expected 'trees_saved' in the response"
    assert "co2_saved" in data["environmental_impact"], "Expected 'co2_saved' in the response"
    assert "statistics" in data, "Expected 'statistics' in the response"
    assert "materials_recycled" in data["statistics"], "Expected 'materials_recycled' in the response"
    assert isinstance(data["statistics"]["materials_recycled"], dict), "Expected 'materials_recycled' to be a dictionary"


@pytest.mark.asyncio
async def test_council_dashboard_success(client, seed_dependencies, generate_testing_token):
    user = seed_dependencies["council_user"]
    token = generate_testing_token(email=user.email, role="council")
    # when I send a GET request to /dashboard
    response = await client.get(
        "/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    # then I get a 200 OK response
    assert response.status_code == status.HTTP_200_OK, "Expected 200 OK response"

    # and the body is a JSON object with the expected fields
    data = response.json()
    assert isinstance(data, dict), "Expected the response to be a dictionary"
    assert "type" in data, "Expected 'type' in the response"
    assert data["type"] == "council", "Expected 'type' to be 'council'"
    assert "material_frequencies" in data, "Expected 'material_frequencies' in the response"
    assert isinstance(data["material_frequencies"], dict), "Expected 'material_frequencies' to be a dictionary"


@pytest.mark.asyncio
async def test_unauth_dashboard(client, seed_dependencies, generate_testing_token):
    # when I send a GET request to /dashboard without authentication
    response = await client.get("/dashboard")
    # then I get a 401 Unauthorized response
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, "Expected 401 Unauthorized response"


@pytest.mark.asyncio
async def test_invalid_role_dashboard(client, seed_dependencies, generate_testing_token):
    user = seed_dependencies["admin_user"]
    token = generate_testing_token(email=user.email, role="admin")
    # when I send a GET request to /dashboard
    response = await client.get(
        "/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    # then I get a 403 Forbidden response
    assert response.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 Forbidden response got: {response.status_code}, DETAIL: {response.json()}"