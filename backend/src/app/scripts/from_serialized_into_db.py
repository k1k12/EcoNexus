import pickle
import argparse
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db
from app.database.models import Council  # Update if your model path differs

overlapping_areas_gss_codes = ["E10000031", "E10000016", "E10000011", "E10000032"]


async def store_councils_in_db(db: AsyncSession, file_path: str, verbose: bool = False):
    with open(file_path, "rb") as f:
        councils = pickle.load(f)

    for council_data in councils:
        if council_data["gss_code"] in overlapping_areas_gss_codes:
            continue
        council = Council(
            gss_code=council_data["gss_code"],
            name=council_data["name"],
            lon_lat_points=council_data["lon_lat_points"]
        )
        await db.merge(council)
        if verbose:
            print(f"[+] Stored {council.gss_code}: {council.name} with {len(council.lon_lat_points)} coordinates")
    
    await db.commit()
    print("[✓] All councils saved to the db.")

async def seed_councils(file_path: str, verbose: bool):
    async for db in get_db():
        await store_councils_in_db(db, file_path=file_path, verbose=verbose)

def main():
    parser = argparse.ArgumentParser(description="Store previously fetched and serialized into .pkl file council areas into the db.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print details during execution")
    parser.add_argument("--file", required=True, help="Path to .pkl file")
    args = parser.parse_args()

    asyncio.run(seed_councils(file_path=args.file, verbose=args.verbose))

if __name__ == "__main__":
    main()
