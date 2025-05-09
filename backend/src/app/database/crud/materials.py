from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Material

async def get_materials(db: AsyncSession):
    """
    Retrieves all materials from the database.

    Args:
        db (AsyncSession): Database session

    Returns:
        List[Material]: A list of all materials
    """
    result = await db.execute(select(Material))
    return result.scalars().all()

async def get_materials_from_id(db: AsyncSession, material_ids: list):
    result = await db.execute(select(Material).where(Material.material_id.in_(material_ids)))
    return result.scalars().all()

async def get_material_by_id(db: AsyncSession, material_id: int):
    result = await db.execute(select(Material).where(Material.material_id==material_id))
    return result.scalars().first()

async def add_material(db: AsyncSession, material: Material):
    """
    Creates a new material in the database.

    Args:
        db (AsyncSession): Database session
        material (Material): The material data required to add a product to the DB

    Returns:
        Material: The created material object
    """
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material
