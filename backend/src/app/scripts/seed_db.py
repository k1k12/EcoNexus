import sys
from sqlalchemy import text
from app.database.models import Material
from app.database.database import SessionLocal
import asyncio

from from_serialized_into_db import seed_councils
from app.scripts.remove_overlapping_areas import remove_overlapping_areas

async def seed_materials():
    async with SessionLocal() as db:
        existing = await db.execute(text("SELECT COUNT(*) FROM material"))
        count = existing.scalar()

        if count == 0:
            materials = [
                Material(name="Glass", synonyms=[
                    "glass", "clear glass", "coloured glass", "bottle glass", 
                    "jar glass", "tempered glass", "glass bottle", "glass jar"
                ]),
                Material(name="Plastic", synonyms=[
                    "plastic", "plastic film", "soft plastic", "rigid plastic", 
                    "unknown plastic", "plastic lid", "plastic container", "plastic wrapper",
                    "plastic tray", "plastic pouch", "plastic blister", "laminate",
                    "shrink wrap", "shrink film", "vacuum pack", "plastic seal", "plastic label",
                    "pet", "pete", "polyethylene terephthalate", "polyester", "pet plastic"
                ]),
                Material(name="PET", synonyms=[
                    "pet", "pete", "polyethylene terephthalate", "polyester", 
                    "polyester plastic", "pet plastic", "01", "1", "polyethylenterephtalat"
                ]),
                Material(name="HDPE", synonyms=[
                    "hdpe", "pehd", "high density polyethylene", "hd polyethylene", 
                    "hdpe plastic", "02", "2"
                ]),
                Material(name="PVC", synonyms=[
                    "pvc", "polyvinyl chloride", "vinyl", "vinyl plastic", 
                    "pvc plastic", "pvc resin", "03", "3"
                ]),
                Material(name="LDPE", synonyms=[
                    "ldpe", "low density polyethylene", "ld polyethylene", 
                    "ldpe plastic", "04", "4"
                ]),
                Material(name="PP", synonyms=[
                    "pp", "polypropylene", "poly propylene", "polypropene", 
                    "pp plastic", "05", "5"
                ]),
                Material(name="PS", synonyms=[
                    "ps", "polystyrene", "poly styrene", "styrene plastic", 
                    "ps plastic", "06", "6"
                ]),
                Material(name="Other Plastic", synonyms=[
                    "other plastic", "miscellaneous plastics", "polycarbonate", 
                    "nylon", "acrylic", "polyurethane", "polylactic acid", 
                    "abs", "bpa", "07", "7", "pla", "pmma", "polyamide", "multilayer plastic",
                    "composite plastic", "multimaterial", "mixed plastic"
                ]),
                Material(name="Metal", synonyms=[
                    "metal", "aluminium", "aluminum", "steel", "tin", "foil", 
                    "metal can", "can", "aluminium foil", "steel tin", "tinplate",
                    "metal lid", "metal cap", "aluminium seal"
                ]),
                Material(name="Paper", synonyms=[
                    "paper", "coated paper", "wax paper", "kraft paper", 
                    "paper wrapper", "paper label", "recycled paper", 
                    "paper sleeve", "printed paper", "thin paper"
                ]),
                Material(name="Cardboard", synonyms=[
                    "cardboard", "corrugated cardboard", "paperboard", 
                    "carton", "card", "carton board", "paper carton", 
                    "recycled carton", "folding box"
                ]),
                Material(name="Tetra Pak", synonyms=[
                    "tetra pak", "tetrapak", "composite carton", 
                    "aseptic carton", "laminated carton", "tetra brik",
                    "drink box", "juice carton"
                ]),
                Material(name="Bioplastic", synonyms=[
                    "bioplastic", "bio plastic", "pla", "polylactic acid",
                    "compostable plastic", "plant-based plastic", "bio-derived plastic"
                ]),
                Material(name="Wood", synonyms=[
                    "wood", "wooden", "bamboo", "wood pulp", "wood fiber", 
                    "wooden stick", "wood lid"
                ]),
                Material(name="Textile", synonyms=[
                    "textile", "fabric", "cloth", "cotton", "woven", "non-woven", 
                    "natural fiber", "synthetic fiber", "linen", "jute", "hemp"
                ]),
            ]
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
