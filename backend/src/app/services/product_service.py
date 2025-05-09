import json
import re
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from rapidfuzz import fuzz
import httpx
from app.services.materials_service import get_materials_service, get_material_by_id_service
from app.database.crud.product import get_product, add_product
from app.database.crud.materials import add_material
from app.database.models import Product, Material
from app.schemas.product import ProductResponse, ProductRequest

from app.json_wrapper.plastic_type_checker import PlasticTypeChecker
plastic_checker = PlasticTypeChecker(package="app.json_wrapper", filename="plastics.json")

async def get_product_service(db: AsyncSession, barcode: str) -> ProductResponse:
    """
    Retrieve a product by barcode, searching from our own database first.

    Parameters:
        db (AsyncSession): Database session.
        barcode (str): The EAN-13 barcode of the product.

    Returns:
        ProductResponse: The product data in pydantic form.

    Raises:
        HTTPException (422): If the barcode is missing or invalid.
    """
    if not barcode:
        raise HTTPException(status_code=422, detail="Barcode invalid.")

    product = await get_product(db, barcode)
    if product:
        print(f"Fetched local response: {product}")
        return ProductResponse(
            name=product.name,
            material=product.material,
            recyclable=bool(product.recyclable),
            barcode=str(product.barcode)
        )
    return await get_product_off_service(db, barcode)

async def get_product_off_service(db: AsyncSession, barcode: str) -> ProductResponse:
    """
    Retrieve product data from the OpenFoodFacts (OFF) API and store it locally.

    Parameters:
        db (AsyncSession): Database session.
        barcode (str): A valid EAN-13 barcode.

    Returns:
        ProductResponse: The product data in pydantic form.

    Raises:
        HTTPException (422): If the barcode or packaging is invalid or unrecognised.
        HTTPException (404): If the product is not found in OFF.
        HTTPException (502): If the API response is bad.
    """
    if not barcode:
        raise HTTPException(status_code=422, detail="Barcode invalid.")

    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to OpenFoodFacts API: {str(e)}")

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Product not found in OpenFoodFacts.")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Unexpected status from OpenFoodFacts: {response.status_code}")

    try:
        product_data = response.json().get("product")
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=502, detail="Invalid JSON returned by OpenFoodFacts.")

    if not product_data:
        raise HTTPException(status_code=404, detail="Product data missing from OpenFoodFacts.")

    print(f"Fetched OFF response: {product_data}")

    product_name = product_data.get("product_name", "Unknown")
    raw_packaging = product_data.get("packaging")
    if not raw_packaging or not raw_packaging.strip():
        raise HTTPException(status_code=422, detail="Packaging information missing.")

    packaging = raw_packaging.strip().lower()
    packaging_recyclable = product_data.get("packaging_recycling", None)

    try:
        material = await map_packaging_to_material(db, packaging)
    except ValueError as e:
        if "missing" in str(e).lower():
            raise HTTPException(status_code=422, detail="Packaging information missing.")
        raise HTTPException(status_code=422, detail="Packaging material not recognised.")

    recyclable = True
    if isinstance(packaging_recyclable, str):
        packaging_recyclable = packaging_recyclable.strip().lower()
        recyclable = packaging_recyclable in ["yes", "true", "1"]
    elif isinstance(packaging_recyclable, bool):
        recyclable = packaging_recyclable
    else:
        recyclable = False

    new_product = Product(
        barcode=str(barcode),
        name=product_name,
        material=material,
        recyclable=recyclable
    )
    await add_product(db, new_product)

    return ProductResponse(
        name=new_product.name,
        barcode=str(new_product.barcode),
        material=material,
        recyclable=new_product.recyclable
    )

async def add_product_service(db: AsyncSession, product: ProductRequest):
    """
    Add a new product to the database if it does not already exist.

    Parameters:
    - db (AsyncSession): Database session.
    - product (ProductRequest): The product data to add.

    Returns:
    - Product: The saved product orm object.
    """
    product_existing = await get_product(db, product.barcode)
    if product_existing:
        return product_existing

    new_product = await create_product(product, product.material)
    return await add_product(db, new_product)

async def check_barcode_ean13(barcode: str) -> bool:
    """
    Validate that a barcode is a correct EAN-13 code.

    Parameters:
        barcode (str): The barcode to validate.

    Returns:
        bool: True if the barcode is valid, if not False.
    """
    if not barcode.isdigit() or len(barcode) != 13:
        return False
    return True

    # digits = list(map(int, barcode))
    # checksum = digits.pop()

    # total = sum(
    #     digit if idx % 2 == 0 else digit * 3
    #     for idx, digit in enumerate(digits)
    # )
    # calculated = (10 - (total % 10)) % 10

    # return checksum == calculated

async def create_product(product: ProductRequest, material: Material = None) -> Product:
    """
    Create a new Product object from a product request and material.

    Parameters:
        product (ProductRequest): The data to make the Product.
        material (Material): The material of product (must be provided).

    Returns:
        Product: The constructed Product object.

    Raises:
        KeyError: If the material is missing.
    """
    if not material:
        raise KeyError("Material not found.")

    return Product(
        barcode=str(product.barcode),
        name=product.name,
        material=material,
        recyclable=bool(product.recyclable)
    )

async def map_packaging_to_material(db: AsyncSession, packaging_string: str) -> Material:
    """
    Map a packaging description string to a known Material in the database.

    Parameters:
        db (AsyncSession): Database session.
        packaging_string (str): The raw packaging description.

    Returns:
        Material: The matched Material instance.

    Raises:
        ValueError: If the packaging string is empty or no material match is found.
    """
    if not packaging_string.strip():
        raise ValueError("missing packaging string")

    cleaned = re.sub(r'&[a-z]+;|[^a-zA-Z0-9 ,/|\\-]', '', packaging_string.lower())
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    parts = [p.strip().lower() for p in re.split(r'[,\-\/|\\]+', cleaned) if p.strip()]

    if not parts:
        raise ValueError("missing packaging parts")

    materials_response = await get_materials_service(db)
    materials = materials_response.materials

    synonym_to_material = {
        syn.lower(): material
        for material in materials
        for syn in material.synonyms
    }

    main_keywords = ["bottle", "can", "box", "bag", "tray", "jar", "carton", "pot", "tube"]
    accessory_keywords = ["lid", "cap", "sleeve", "wrap", "straw"]

    main_materials = []
    accessory_materials = []

    for part in parts:
        matched_material = None
        best_score = 0
        best_match = None

        for synonym, material_obj in synonym_to_material.items():
            score = fuzz.ratio(part, synonym)
            if score > best_score and score >= 85:
                best_score = score
                best_match = material_obj

        matched_material = best_match

        if not matched_material:
            for synonym, material_obj in synonym_to_material.items():
                if fuzz.partial_ratio(part, synonym) >= 85:
                    matched_material = material_obj
                    break

        if matched_material and matched_material.name.lower() == "plastic":
            plastic_type = plastic_checker.check_type(part)
            if plastic_type:
                print(f"Matched plastic subtype: {plastic_type}")
                subtype_match = next(
                    (mat for mat in materials if mat.name.lower() == plastic_type.lower()),
                    None
                )
                if subtype_match:
                    matched_material = subtype_match

        if matched_material:
            if any(keyword in part for keyword in main_keywords):
                main_materials.append(matched_material)
            elif any(keyword in part for keyword in accessory_keywords):
                accessory_materials.append(matched_material)
            else:
                main_materials.append(matched_material)

    if main_materials:
        return await get_material_by_id_service(db, main_materials[0].material_id)
    if accessory_materials:
        return await get_material_by_id_service(db, accessory_materials[0].material_id)

    raise ValueError("Packaging material not recognised.")
