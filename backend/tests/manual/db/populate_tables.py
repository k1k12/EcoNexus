import os
import argparse
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.database.models import (
    Council,
    User,
    Admin,
    Material,
    RecyclingPoint,
    Product,
    RecycleHistory,
    RecycleHistoryProductAssociation,
)
from app.core.utils import get_password_hash

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("Check .env for db url")

SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
engine = create_engine(SYNC_DATABASE_URL, echo=False, future=True)
SyncSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def clear_tables(session):
    session.execute(text("SET session_replication_role = 'replica';"))
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.execute(text("SET session_replication_role = 'origin';"))
    session.commit()

def create_council(session):
    council = Council(
        gss_code="TEST-GSS-001",
        name="Sofia's Superior Council",
        lon_lat_points=[[-1.61, 54.97], [-1.59, 54.96], [-1.58, 54.95]]
    )
    session.add(council)
    session.commit()
    return council

def create_user(session, email, first, last, password, role, gss_code=None, mfa_key=""):
    user = User(
        email=email,
        first_name=first,
        last_name=last,
        hashed_password=get_password_hash(password),
        role=role,
        is_suspended=False,
        mfa_key=mfa_key,
        gss_code=gss_code
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def approve_council_user(session, user):
    session.add(Admin(
        date=date.today(),
        council_user_id=user.user_id,
        gss_code=user.gss_code,
        is_approved=True
    ))
    session.commit()

def create_materials(session):
    mat_data = [
        ("Glass", ["glass", "bottle"]),
        ("Paper", ["paper", "box"]),
        ("Plastic", ["plastic", "container"]),
        ("Metal", ["metal", "can"]),
        ("Composite", ["tetrapak", "foil"])
    ]
    materials = [Material(name=name, synonyms=syns) for name, syns in mat_data]
    session.add_all(materials)
    session.commit()
    return materials

def create_products(session, materials):
    material_map = {m.name: m.material_id for m in materials}

    infos = [
        {"barcode": "3029330003533", "name": "Nutella", "material": "Glass", "recyclable": True},
        {"barcode": "5000159484695", "name": "Walkers Crisps", "material": "Plastic", "recyclable": False},
        {"barcode": "5449000000996", "name": "Coca-Cola", "material": "Metal", "recyclable": True},
    ]

    products = []
    for info in infos:
        mid = material_map.get(info["material"])
        if not mid:
            raise ValueError(f"Material '{info['material']}' not found in materials list")
        products.append(Product(
            barcode=info["barcode"],
            name=info["name"],
            material_id=mid,
            recyclable=info.get("recyclable", True)
        ))

    session.add_all(products)
    session.commit()
    return products

def create_recycling_points(session, council, user, materials):
    times = {d: ["08:00", "17:00"] for d in ["monday", "tuesday", "wednesday", "thursday", "friday"]}
    times.update({"saturday": ["Closed", "Closed"], "sunday": ["Closed", "Closed"]})

    points = [
        RecyclingPoint(
            latitude=54.9885,
            longitude=-1.5996,
            user_id=user.user_id,
            gss_code=council.gss_code,
            times_open=times,
            materials=[materials[0], materials[1]]
        ),
        RecyclingPoint(
            latitude=54.9803,
            longitude=-1.6036,
            user_id=user.user_id,
            gss_code=council.gss_code,
            times_open=times,
            materials=[materials[1], materials[2]]
        ),
        RecyclingPoint(
            latitude=54.9772,
            longitude=-1.6115,
            user_id=user.user_id,
            gss_code=council.gss_code,
            times_open=times,
            materials=[materials[2], materials[3]]
        ),
        RecyclingPoint(
            latitude=54.9745,
            longitude=-1.5953,
            user_id=user.user_id,
            gss_code=council.gss_code,
            times_open=times,
            materials=[materials[0], materials[2], materials[4]]
        )
    ]

    session.add_all(points)
    session.commit()
    return points

def create_recycle_history(session, user, point, products):
    for i, product in enumerate(products):
        d = datetime.now() - timedelta(days=i)
        history = RecycleHistory(date=d, user_id=user.user_id, point_id=point.point_id)
        assoc = RecycleHistoryProductAssociation(
            date=d,
            user_id=user.user_id,
            product_barcode=product.barcode,
            point_id=point.point_id,
            quantity=i + 1
        )
        session.add(history)
        session.add(assoc)
    session.commit()

def main(verbose=False):
    Base.metadata.create_all(bind=engine)
    session = SyncSessionLocal()

    try:
        if verbose: print("Clearing tables…")
        clear_tables(session)

        if verbose: print("Creating council…")
        council = create_council(session)

        if verbose: print("Creating users…")
        admin = create_user(session, "admin@system.com", "Test", "Admin", "test", "admin")
        council_user = create_user(session, "sofia@test.com", "Sofia", "OuiOuiBaguette", "test", "council", gss_code=council.gss_code, mfa_key="123456")
        user = create_user(session, "danny@test.com", "Danny", "User", "test", "user")

        approve_council_user(session, council_user)

        if verbose: print("Creating materials and products…")
        materials = create_materials(session)
        products = create_products(session, materials)

        if verbose: print("Creating recycling points…")
        points = create_recycling_points(session, council, admin, materials)

        if verbose: print("Creating recycle history…")
        create_recycle_history(session, admin, points[0], products)
        create_recycle_history(session, council_user, points[1], products)
        create_recycle_history(session, user, points[2], products)

        print("Database seeded successfully.")
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database for tests")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    main(verbose=args.verbose)
