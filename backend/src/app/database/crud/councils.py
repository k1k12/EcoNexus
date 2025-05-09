from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database.models import Council, Admin, User

async def get_all_councils(db: AsyncSession) -> List[Council]:
    result = await db.execute(select(Council))
    return result.scalars().all()

async def get_council_from_user_id(db: AsyncSession, council_user_id: int) -> Council | None:
    """
    Get the council associated with a user ID.
    
    returns:
        Council: The council object if found, otherwise None.
    """
    result = await db.execute(
        select(Council)
        .join(Admin)
        .where(
            Admin.council_user_id == council_user_id,
            Admin.is_approved.is_(True)
        )
    )
    return result.scalars().first()