from shapely.geometry import Polygon
from shapely import wkt
from sqlalchemy import text
from app.database.database import SessionLocal
import json

async def remove_overlapping_areas():
    async with SessionLocal() as db:
        result = await db.execute(text("SELECT gss_code, lon_lat_points FROM council"))
        councils = result.fetchall()

        polygons = []
        for row in councils:
            code, points = row
            try:
                polygon = Polygon(points)
                polygons.append((code, polygon))
            except Exception as e:
                print(f"Invalid polygon for {code}: {e}")

        keep = set()
        for i, (code_i, poly_i) in enumerate(polygons):
            is_container = False
            for j, (code_j, poly_j) in enumerate(polygons):
                if i == j:
                    continue

                # use .covers() instead of testing within()
                # this returns True if poly_i contains OR touches poly_j 
                if poly_i.covers(poly_j):
                    is_container = True
                    break

            if not is_container:
                keep.add(code_i)

        # Remove nested councils
        all_codes = set(code for code, _ in polygons)
        to_remove = all_codes - keep
        if to_remove:
            placeholders = ','.join([f":code{i}" for i in range(len(to_remove))])
            stmt = text(f"DELETE FROM council WHERE gss_code IN ({placeholders})")
            params = {f"code{i}": code for i, code in enumerate(to_remove)}
            await db.execute(stmt, params)
            await db.commit()
            print(f"Removed {len(to_remove)} overlapping councils.")
        else:
            print("No overlapping councils found.")

