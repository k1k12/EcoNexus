from app.database.models import Material
from app.database.crud.materials import get_materials, get_materials_from_id, get_material_by_id
from app.schemas.materials import MaterialsResponse, Material as MaterialSchema
from sqlalchemy.ext.asyncio import AsyncSession

async def get_materials_service(db: AsyncSession) -> MaterialsResponse:
    """
    Fetches materials from the database and converts them into a MaterialsResponse object.

    Args:
        db (AsyncSession): The database session.

    Returns:
        MaterialsResponse: A MaterialsResponse object.
    """
    # Get SQLAlchemy models
    material_models = await get_materials(db)

    # Convert them into Pydantic models
    materials = [
        MaterialSchema(
            material_id=m.material_id,
            synonyms=m.synonyms,
            name=m.name
        )
        for m in material_models
    ]

    return MaterialsResponse(materials=materials)

async def get_materials_list(db: AsyncSession, material_ids: list):
    """
    TBR
    """

    if not material_ids:
        raise ValueError("Materials not found.")

    return await get_materials_from_id(db, material_ids)

async def get_material_by_id_service(db: AsyncSession, material_id: int):
    if not material_id:
        raise ValueError("Material not found.")
    return await get_material_by_id(db, material_id)
