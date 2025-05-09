from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from fastapi import HTTPException

from app.api.dependencies import get_db, get_current_user
from app.services.materials_service import get_materials_service
from app.schemas.materials import Material

router = APIRouter()

@router.get("/materials", response_model=List[Material])
async def get_materials(db: AsyncSession = Depends(get_db)):
    """
    Fetches materials from the database and returns them.

    Args:
        db (AsyncSession): The database session.

    Returns:
        List[Material]: A list of material objects
    """
    data = await get_materials_service(db)
    
    if not data.materials:  # Accessing the actual list inside the response
        raise HTTPException(status_code=404, detail="No materials found")
    
    return [
            Material(
                material_id=m.material_id,
                synonyms=m.synonyms,
                name=m.name
            )
            for m in data.materials
        ]
