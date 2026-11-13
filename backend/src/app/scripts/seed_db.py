import sys
from sqlalchemy import text
from app.database.models import Material
from app.scripts.materials_data import MATERIALS
from app.database.database import SessionLocal
import asyncio

from from_serialized_into_db import seed_councils
from app.scripts.remove_overlapping_areas import remove_overlapping_areas

async def seed_materials():
    async with SessionLocal() as db:
        existing = await db.execute(text("SELECT COUNT(*) FROM material"))
        count = existing.scalar()

        if count == 0:
            materials = [Material(**m) for m in MATERIALS]
            db.add_all(materials)
            await db.commit()
            print("Seeded materials.")
        else:
            print("Materials already exist.")
def usage():
    print("USAGE: <path to areas.pkl>");

async def create_all():
    from app.database.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def seed_db():
    if len(sys.argv) != 2:
        usage()
        return
    await create_all()
    await seed_materials()
    await seed_councils(sys.argv[1], False)
    await remove_overlapping_areas()

if __name__ == "__main__":
    asyncio.run(seed_db())
