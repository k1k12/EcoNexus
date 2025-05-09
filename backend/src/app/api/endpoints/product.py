########## Imports ##########

from fastapi import APIRouter, HTTPException, Depends
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.services.product_service import (get_product_service, 
                                          get_product_off_service,
                                          check_barcode_ean13,
                                          add_product_service,
                                          )
from app.services.recycle_history_services import create_recycle_entry_service
from app.schemas.product import ProductResponse
from app.schemas.recycle_history import RecycleResponse, RecycleRequest

router = APIRouter()

@router.get("/product/{barcode}", response_model=ProductResponse)
async def get_product(db: AsyncSession = Depends(get_db), barcode: str = None):
    """
    This endpoint retrieves product data from OFF API using a barcode passed from the frontend.
    
    Parameters:
        barcode (string): EAN-13 barcode of the product to retrieve information about.

    Returns:
        ProductResponse: A dictionary containing product name, barcode, material, and recycabilty status (t/f). 

    Raises:
        422 Unprocessable Entity: If the barcode is missing or not in valid EAN-13 format.
        404 Not Found: If the product is not found in the local database or OFF.
        422 Unprocessable Entity: If packaging information is missing or cannot be interpreted.
        502 Bad Gateway: If there is an issue communicating with the OFF API.

    Example:
        GET /product/4006381333931

        Response:
        {
            "name": "Super Glass Bottle",
            "barcode": "4006381333931",
            "material": "Glass",
            "recyclable": true
        }
    """
    if barcode is None or barcode.strip() == "":
        raise HTTPException(status_code=422, detail="Barcode is required.")

    barcode = barcode.strip()

    if not await check_barcode_ean13(barcode):
        raise HTTPException(status_code=422, detail="Barcode in incorrect format; not EAN 13.")

    return await get_product_service(db, barcode)

@router.post("/recycle", response_model=RecycleResponse)
async def recycle_product(payload: RecycleRequest,
                          db: AsyncSession = Depends(get_db),
                          user = Depends(get_current_user)):
    """
    This endpoint retrieves recycling information for a product using its barcode.
    
    Parameters:
        payload (RecycleRequest): A request body containing the recycling point ID and product quantities.
        db (AsyncSession): The database session.
        user (User): The current user, obtained from the authentication dependency.

    Returns:
        RecycleResponse: A dictionary containing recycling information for the product.

    Raises:
        422 Unprocessable Entity: If packaging information is missing or cannot be interpreted.

    Example:
        POST /recycle
        {
            "recycling_point_id": 1,
            "product_quantities": {
                "4006381333931": 2,
                "4006381333932": 3
        }

    """
    if payload.product_quantities is None or not isinstance(payload.product_quantities, dict):
        raise HTTPException(status_code=422, detail="Product quantities are required.")

    if payload.recycling_point_id is None:
        raise HTTPException(status_code=422, detail="Recycling point ID is required.")


    return await create_recycle_entry_service(db, 
                                              user_id=user.user_id,
                                              recycling_point_id=payload.recycling_point_id,
                                              product_quantities=payload.product_quantities)
