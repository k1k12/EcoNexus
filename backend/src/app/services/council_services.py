from sqlalchemy.ext.asyncio import AsyncSession
from app.database.crud.councils import get_all_councils

async def fetch_all_councils(db: AsyncSession):
    return await get_all_councils(db)