import pytest
import json
from unittest.mock import patch
from httpx import Response
from app.services.product_service import check_barcode_ean13, map_packaging_to_material
from app.database.models import Product, Material

# --- Barcode Validation Tests ---

@pytest.mark.asyncio
@pytest.mark.parametrize("barcode,ok", [
    ("4006381333931", True),
    ("4006381333930", True),
    ("123", False),
    ("ABCDEFGHIJKLM", False),
    ("", False),
    ("40063813339", False),
    ("40063813339312", False),
])
async def test_check_barcode_ean13(barcode, ok):
    result = await check_barcode_ean13(barcode)
    assert result is ok

# --- Product Lookup Tests ---

@pytest.mark.asyncio
async def test_get_product_local_first(client, seed_dependencies, generate_testing_token):
    existing: Product = seed_dependencies["product"]
    token = generate_testing_token(email="user@site.com")
    r = await client.get(f"/product/{existing.barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["barcode"] == str(existing.barcode)
    assert isinstance(data["name"], str)

@pytest.mark.asyncio
async def test_get_product_bad_format(client, generate_testing_token):
    token = generate_testing_token(email="user@site.com")
    r = await client.get("/product/12345", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422
    assert "EAN 13" in r.json()["detail"]

@pytest.mark.asyncio
async def test_get_product_off_fetch_and_store(client, seed_dependencies, generate_testing_token, db_session):
    material_glass = Material(name="Glass", synonyms=["glass", "GL"])
    material_plastic = Material(name="Plastic", synonyms=["plastic", "PET"])
    db_session.add_all([material_glass, material_plastic])
    await db_session.commit()
    await db_session.refresh(material_glass)
    await db_session.refresh(material_plastic)

    barcode = "4006381333931"
    token = generate_testing_token(email=seed_dependencies["user"].email, role="user")
    mock_response = Response(
        status_code=200,
        content=json.dumps({"product": {"product_name": "Super Glass Bottle", "packaging": "Glass Bottle, Plastic Lid"}}).encode(),
        headers={"Content-Type": "application/json"}
    )

    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    payload = r.json()
    assert isinstance(payload["material"], dict)
    assert "glass" in payload["material"]["name"].lower()

@pytest.mark.asyncio
async def test_get_product_off_not_found(client, generate_testing_token):
    barcode = "5901234123457"
    token = generate_testing_token(email="user@site.com")
    mock_response = Response(status_code=404, content=json.dumps({}).encode(), headers={"Content-Type": "application/json"})
    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404

@pytest.mark.asyncio
async def test_off_mapping_unknown_material(client, generate_testing_token):
    barcode = "5012345678900"
    token = generate_testing_token(email="user@site.com")
    mock_response = Response(
        status_code=200,
        content=json.dumps({"product": {"product_name": "Mystery Box", "packaging": "Foam and Rubber"}}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422

# --- Packaging Material Mapping Tests ---

@pytest.mark.asyncio
async def test_map_packaging_prefers_glass_over_plastic(seed_dependencies):
    db = seed_dependencies["test_db"]

    material_glass = Material(name="Glass", synonyms=["glass", "GL"])
    material_plastic = Material(name="Plastic", synonyms=["plastic", "PET"])

    db.add_all([material_glass, material_plastic])
    await db.commit()
    await db.refresh(material_glass)
    await db.refresh(material_plastic)

    packaging = "Glass Bottle, Plastic Lid"
    material = await map_packaging_to_material(db, packaging)

    assert material is not None
    assert isinstance(material, Material)
    assert "glass" in material.name.lower()

# --- Validation and Error Cases ---

@pytest.mark.asyncio
async def test_empty_barcode(client, generate_testing_token):
    token = generate_testing_token(email="user@site.com")
    r = await client.get("/product/ ", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422
    assert "barcode" in r.json()["detail"].lower()

@pytest.mark.asyncio
async def test_invalid_packaging_format(client, generate_testing_token, db_session):
    material_plastic = Material(name="Plastic", synonyms=["plastic", "PET"])
    material_glass = Material(name="Glass", synonyms=["glass", "GL"])
    db_session.add_all([material_plastic, material_glass])
    await db_session.commit()

    barcode = "4006381333931"
    token = generate_testing_token(email="user@site.com")
    mock_response = Response(
        status_code=200,
        content=json.dumps({"product": {"product_name": "Super Item", "packaging": "Unobtanium Foam"}}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422

@pytest.mark.asyncio
async def test_non_recyclable_material(client, generate_testing_token, db_session):
    material_plastic = Material(name="Plastic", synonyms=["plastic", "PET"])
    db_session.add(material_plastic)
    await db_session.commit()

    barcode = "4006381333931"
    token = generate_testing_token(email="user@site.com")
    mock_response = Response(
        status_code=200,
        content=json.dumps({
            "product": {
                "product_name": "Plastic Bag",
                "packaging": "Plastic",
                "packaging_recycling": "no"
            }
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    payload = r.json()
    assert payload["recyclable"] is False

@pytest.mark.asyncio
async def test_missing_material_in_openfoodfacts(client, generate_testing_token):
    from unittest.mock import MagicMock

    barcode = "4006381333931"
    token = generate_testing_token(email="user@site.com")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "product": {
            "product_name": "Mystery Box",
            "packaging": ""
        }
    }

    with patch("app.services.product_service.get_product", return_value=None), \
         patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response

        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})

    assert r.status_code == 422
    assert "packaging information" in r.json()["detail"].lower()

@pytest.mark.asyncio
async def test_multiple_synonyms_in_packaging(client, generate_testing_token, db_session):
    material_plastic = Material(name="Plastic", synonyms=["plastic", "PET"])
    db_session.add(material_plastic)
    await db_session.commit()

    barcode = "4006381333931"
    token = generate_testing_token(email="user@site.com")
    mock_response = Response(
        status_code=200,
        content=json.dumps({"product": {"product_name": "Mixed Pack", "packaging": "Plastic, PET Bottle"}}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with patch("app.services.product_service.httpx.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value.__aenter__.return_value
        mock_client.get.return_value = mock_response
        r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    payload = r.json()
    assert isinstance(payload["material"], dict)
    assert "plastic" in payload["material"]["name"].lower()

@pytest.mark.asyncio
async def test_invalid_barcode_format(client, generate_testing_token):
    barcode = "12345"
    token = generate_testing_token(email="user@site.com")
    r = await client.get(f"/product/{barcode}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422
    assert "EAN 13" in r.json()["detail"]