from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database.models import RecyclingPoint, Council, Material, RecycleHistory, RecycleHistoryProductAssociation, Product

async def add_point(db: AsyncSession, point: RecyclingPoint) -> RecyclingPoint:
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point

async def update_point(db: AsyncSession, point_id: int, updates: dict) -> Optional[RecyclingPoint]:
    db_point = await get_point_by_id(db, point_id)
    if not db_point:
        return None

    for k, v in updates.items():
        setattr(db_point, k, v)

    await db.commit()
    await db.refresh(db_point)
    return db_point

async def delete_point(db: AsyncSession, point_id: int) -> Optional[RecyclingPoint]:
    db_point = await get_point_by_id(db, point_id)
    if not db_point:
        return None

    await db.delete(db_point)
    await db.commit()
    return db_point

async def get_points(db: AsyncSession) -> List[RecyclingPoint]:
    stmt   = select(RecyclingPoint).options(selectinload(RecyclingPoint.materials))
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_points_by_council_id(db: AsyncSession, council_id: int) -> List[RecyclingPoint]:
    stmt   = select(RecyclingPoint).options(selectinload(RecyclingPoint.materials)).where(RecyclingPoint.user_id == council_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_points_by_area(
    db: AsyncSession,
    min_lat: float, min_lon: float,
    max_lat: float, max_lon: float
) -> List[RecyclingPoint]:
    stmt = (
        select(RecyclingPoint).options(selectinload(RecyclingPoint.materials))
        .where(
            RecyclingPoint.latitude  >= min_lat,
            RecyclingPoint.latitude  <= max_lat,
            RecyclingPoint.longitude >= min_lon,
            RecyclingPoint.longitude <= max_lon,
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_points_by_materials(
    db: AsyncSession,
    material_ids: List[int]
) -> List[RecyclingPoint]:
    stmt = (
        select(RecyclingPoint)
        .options(selectinload(RecyclingPoint.materials))
        .join(RecyclingPoint.materials)
        .filter(Material.material_id.in_(material_ids))
        .group_by(RecyclingPoint.point_id)
        .having(func.count(Material.material_id) == len(material_ids))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_point_by_id(db: AsyncSession, point_id: int) -> Optional[RecyclingPoint]:
    stmt   = select(RecyclingPoint).options(selectinload(RecyclingPoint.materials)).where(RecyclingPoint.point_id == point_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def check_point_at_location(db: AsyncSession, latitude: float, longitude: float) -> bool:
    stmt   = select(RecyclingPoint).options(selectinload(RecyclingPoint.materials)).where(
        RecyclingPoint.latitude  == latitude,
        RecyclingPoint.longitude == longitude,
    )
    result = await db.execute(stmt)
    return result.scalars().first() is not None

async def get_council_by_gss(db: AsyncSession, gss_code: str) -> Optional[Council]:
    stmt   = select(Council).where(Council.gss_code == gss_code)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_points_by_council_code(db: AsyncSession, gss_code: str) -> List[RecyclingPoint]:
    """
    Get recycling points by council GSS code, with eager loading of materials and recycle histories.
    
    returns:
        List[RecyclingPoint]: A list of recycling points associated with the given council GSS code.
    """

    stmt = (
        select(RecyclingPoint)
        .options(
            selectinload(RecyclingPoint.materials),
            selectinload(RecyclingPoint.recycle_histories)
                .selectinload(RecycleHistory.product_associations)
                .selectinload(RecycleHistoryProductAssociation.product)
                .selectinload(Product.material),
    )
    .where(RecyclingPoint.gss_code == gss_code)
)
    result = await db.execute(stmt)
    return result.scalars().all()
