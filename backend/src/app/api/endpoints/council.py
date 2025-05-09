from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.dependencies import get_db
from app.services.council_services import fetch_all_councils
from app.schemas.council import CouncilRead  # your Pydantic model

router = APIRouter()

@router.get("/all-councils", response_model=List[CouncilRead])
async def get_all_councils(db: AsyncSession = Depends(get_db)):
    """
    Fetch all council objects stored in the database.
    This endpoint is used to retrieve all councils for display in the frontend.

    example: {
    councils: [
        {
            "gss_code": "E07000001",
            "name": "Aberdeen City",
            "lon_lat_points": [
                [57.123456, -2.123456],
                [57.654321, -2.654321]
            ]
        },
        {
            "gss_code": "E07000002",
            "name": "Aberdeenshire",
            "lon_lat_points": [
                [57.987654, -2.987654],
                [57.543210, -2.543210]
            ]
        }
    ]
    }
    """
    return await fetch_all_councils(db)