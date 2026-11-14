"""Seed a live database with demo data.

Runs on every deploy and start. Materials, products and the demo council area
are only added if missing. The demo recycling points and the public demo
accounts are wiped and rebuilt each time, so anything a visitor changes is
undone on the next start.

The public demo logins (see app/core/demo.py) are only created when
DEMO_ACCOUNTS=true. Without it there are no accounts with known passwords:
the points belong to an account with a random password nobody knows, and an
admin is only made if ADMIN_EMAIL and ADMIN_PASSWORD are set.

Run from backend/: PYTHONPATH=src python -m app.scripts.seed_demo
"""
import json
import os
import random
import secrets
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, delete, or_, select
from sqlalchemy.orm import Session

from app.core.db_url import database_url_for
from app.core.demo import DEMO_ACCOUNTS, DEMO_DOMAIN, demo_accounts_enabled
from app.core.utils import get_password_hash
from app.database.models import (
    Admin,
    Council,
    Material,
    Product,
    RecycleHistory,
    RecycleHistoryProductAssociation,
    RecyclingPoint,
    User,
    recycling_point_material_association,
)
from app.scripts.materials_data import MATERIALS

load_dotenv()

DEMO_GSS = "E08000021"
DEMO_OWNER_EMAIL = "demo-council@econexus.invalid"

# Real recycling point locations from OpenStreetMap, made by fetch_osm_points.py
OSM_POINTS_FILE = Path(__file__).parent / "data" / "newcastle_recycling_points.json"

# Rough box around central Newcastle, not the real council boundary
DEMO_AREA = [[-1.70, 55.01], [-1.55, 55.01], [-1.55, 54.95], [-1.70, 54.95], [-1.70, 55.01]]

WEEKDAYS = {d: ["08:00", "18:00"] for d in ["monday", "tuesday", "wednesday", "thursday", "friday"]}
OPENING_TIMES = {**WEEKDAYS, "saturday": ["09:00", "16:00"], "sunday": ["Closed", "Closed"]}
# Street bottle banks and clothes banks can be used any time
ALL_DAY = {d: ["00:01", "23:59"] for d in [*WEEKDAYS, "saturday", "sunday"]}

POINTS = [
    (54.9885, -1.5996, ["Glass", "Paper", "Cardboard"]),
    (54.9803, -1.6036, ["Plastic", "PET", "HDPE", "Metal"]),
    (54.9772, -1.6115, ["Glass", "Metal", "Tetra Pak"]),
    (54.9745, -1.5953, ["Paper", "Cardboard", "Plastic"]),
    (54.9690, -1.6180, ["Textile", "Glass"]),
]

PRODUCTS = [
    ("3029330003533", "Nutella", "Glass", True),
    ("5000159484695", "Walkers Crisps", "Plastic", False),
    ("5449000000996", "Coca-Cola", "Metal", True),
]



def load_demo_points():
    """The OpenStreetMap points if they've been downloaded, else the hand-made ones.

    Returns the council area outline and a list of (lat, lon, materials, opening times).
    """
    if not OSM_POINTS_FILE.exists():
        return DEMO_AREA, [(lat, lon, names, OPENING_TIMES) for lat, lon, names in POINTS]

    with open(OSM_POINTS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    south, west, north, east = data["bbox"]
    area = [[west, north], [east, north], [east, south], [west, south], [west, north]]
    points = []
    for p in data["points"]:
        # OpenStreetMap rarely has hours for street banks, so centres get example hours
        hours = p["hours"] or (OPENING_TIMES if p["centre"] else ALL_DAY)
        points.append((p["lat"], p["lon"], p["materials"], hours))
    return area, points


# Everyday items for the demo history. The barcodes start with 200, a range GS1
# keeps for in-store use, so they can never match a real product.
DEMO_PRODUCTS = [
    ("2000000000015", "Glass jam jar", "Glass", True),
    ("2000000000022", "Glass wine bottle", "Glass", True),
    ("2000000000039", "Aluminium drinks can", "Metal", True),
    ("2000000000046", "Steel food tin", "Metal", True),
    ("2000000000053", "Plastic milk bottle", "HDPE", True),
    ("2000000000060", "Shampoo bottle", "HDPE", True),
    ("2000000000077", "Water bottle", "PET", True),
    ("2000000000084", "Fizzy drink bottle", "PET", True),
    ("2000000000091", "Yoghurt pot", "PP", True),
    ("2000000000107", "Takeaway tray", "PS", False),
    ("2000000000114", "Cling film", "LDPE", False),
    ("2000000000121", "Crisp packet", "Other Plastic", False),
    ("2000000000138", "Cereal box", "Cardboard", True),
    ("2000000000145", "Pizza box", "Cardboard", True),
    ("2000000000152", "Delivery box", "Cardboard", True),
    ("2000000000169", "Newspaper", "Paper", True),
    ("2000000000176", "Paper carrier bag", "Paper", True),
    ("2000000000183", "Juice carton", "Tetra Pak", True),
    ("2000000000190", "Old T-shirt", "Textile", True),
    ("2000000000206", "Compostable coffee cup", "Bioplastic", False),
]

# How often each kind of item turns up in a recycling trip
PRODUCT_WEIGHTS = [6, 3, 8, 4, 6, 2, 5, 4, 4, 1, 1, 2, 5, 3, 3, 4, 2, 4, 1, 1]

HISTORY_DAYS = 120
FAKE_RESIDENTS = 25


def get_or_create_materials(session: Session) -> dict:
    existing = {m.name: m for m in session.scalars(select(Material))}
    for m in MATERIALS:
        if m["name"] not in existing:
            material = Material(**m)
            session.add(material)
            existing[m["name"]] = material
    session.flush()
    return existing


def get_or_create_user(session: Session, email: str, **fields) -> User:
    user = session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, is_suspended=False, mfa_key="", **fields)
        session.add(user)
        session.flush()
    return user


def clear_demo_area_and_accounts(session: Session):
    """Remove the demo points, the demo logins and anything that points at them."""
    point_ids = list(session.scalars(select(RecyclingPoint.point_id).where(RecyclingPoint.gss_code == DEMO_GSS)))
    demo_ids = list(session.scalars(select(User.user_id).where(User.email.like(f"%@{DEMO_DOMAIN}"))))

    session.execute(delete(RecycleHistoryProductAssociation).where(or_(
        RecycleHistoryProductAssociation.point_id.in_(point_ids),
        RecycleHistoryProductAssociation.user_id.in_(demo_ids),
    )))
    session.execute(delete(RecycleHistory).where(or_(
        RecycleHistory.point_id.in_(point_ids),
        RecycleHistory.user_id.in_(demo_ids),
    )))
    session.execute(delete(recycling_point_material_association).where(
        recycling_point_material_association.c.recycling_point_id.in_(point_ids)
    ))
    session.execute(delete(RecyclingPoint).where(RecyclingPoint.point_id.in_(point_ids)))
    session.execute(delete(Admin).where(Admin.council_user_id.in_(demo_ids)))
    session.execute(delete(User).where(User.user_id.in_(demo_ids)))
    session.flush()


def create_demo_accounts(session: Session) -> dict:
    accounts = {}
    for account in DEMO_ACCOUNTS:
        # The pending council never logs in, so it gets a password nobody knows
        password = account["password"] or secrets.token_urlsafe(32)
        user = User(
            email=account["email"],
            first_name=account["first_name"],
            last_name=account["last_name"],
            role=account["role"],
            gss_code=DEMO_GSS if account["role"] == "council" else None,
            hashed_password=get_password_hash(password),
            is_suspended=False,
            mfa_key="",
        )
        session.add(user)
        session.flush()
        if account["role"] == "council":
            session.add(Admin(
                date=date.today(),
                council_user_id=user.user_id,
                gss_code=DEMO_GSS,
                is_approved=account["approved"],
            ))
        accounts[account["role"] if account.get("approved", True) else "pending"] = user
    session.flush()
    return accounts


def create_demo_points(session: Session, owner: User, materials: dict, demo_points: list) -> list:
    points = []
    for lat, lon, names, hours in demo_points:
        point = RecyclingPoint(
            latitude=lat,
            longitude=lon,
            user_id=owner.user_id,
            gss_code=DEMO_GSS,
            times_open=hours,
            materials=[materials[n] for n in names],
        )
        session.add(point)
        points.append(point)
    session.flush()
    return points


def add_history(session: Session, rng: random.Random, user: User, local_points: list,
                products: list, trips_per_week: float, growth: float):
    """Give a user a few months of recycling trips, mostly at their local points.

    growth > 1 means they recycle more as the weeks go on, so the dashboard
    shows them improving.
    """
    now = datetime.now().replace(microsecond=0)
    barcodes = [p[0] for p in products]
    used = set()
    for days_ago in range(HISTORY_DAYS, 0, -1):
        # Older days get fewer trips when growth > 1
        rate = trips_per_week / 7 * growth ** (-(days_ago / 7) / (HISTORY_DAYS / 7))
        for _ in range(int(rate) + (rng.random() < rate % 1)):
            when = now - timedelta(days=days_ago, hours=rng.randint(0, 10), minutes=rng.randint(0, 59))
            if when in used:
                continue
            used.add(when)
            point_id = rng.choice(local_points).point_id
            session.add(RecycleHistory(date=when, user_id=user.user_id, point_id=point_id))
            for barcode in set(rng.choices(barcodes, weights=PRODUCT_WEIGHTS, k=rng.randint(1, 4))):
                session.add(RecycleHistoryProductAssociation(
                    date=when, user_id=user.user_id, product_barcode=barcode,
                    point_id=point_id, quantity=rng.randint(1, 3),
                ))


def create_demo_history(session: Session, demo_user: User, points: list):
    """Months of activity: the demo user's own, plus fake residents for the council view."""
    # Same numbers every start, just shifted to stay relative to today
    rng = random.Random(2033)
    session.flush()

    local = rng.sample(points, min(4, len(points)))
    add_history(session, rng, demo_user, local, DEMO_PRODUCTS, trips_per_week=4, growth=1.8)

    for i in range(1, FAKE_RESIDENTS + 1):
        resident = User(
            email=f"resident-{i:02d}@{DEMO_DOMAIN}",
            first_name="Demo",
            last_name=f"Resident {i}",
            role="user",
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            is_suspended=False,
            mfa_key="",
        )
        session.add(resident)
        session.flush()
        local = rng.sample(points, min(rng.randint(2, 5), len(points)))
        add_history(session, rng, resident, local, DEMO_PRODUCTS,
                    trips_per_week=rng.uniform(0.5, 3.5), growth=rng.uniform(0.8, 1.6))
    session.flush()


def seed(session: Session):
    area, demo_points = load_demo_points()
    council = session.get(Council, DEMO_GSS)
    if council is None:
        session.add(Council(gss_code=DEMO_GSS, name="Newcastle upon Tyne (demo area)", lon_lat_points=area))
    else:
        # Keep the outline in step with the points, e.g. after downloading OpenStreetMap data
        council.lon_lat_points = area
    session.flush()

    materials = get_or_create_materials(session)

    for barcode, name, material, recyclable in PRODUCTS + DEMO_PRODUCTS:
        if session.get(Product, barcode) is None:
            session.add(Product(barcode=barcode, name=name, material_id=materials[material].material_id, recyclable=recyclable))
    session.flush()

    clear_demo_area_and_accounts(session)

    if demo_accounts_enabled():
        accounts = create_demo_accounts(session)
        points = create_demo_points(session, accounts["council"], materials, demo_points)
        create_demo_history(session, accounts["user"], points)
    else:
        owner = get_or_create_user(
            session,
            DEMO_OWNER_EMAIL,
            first_name="Demo",
            last_name="Council",
            role="council",
            gss_code=DEMO_GSS,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        )
        if session.scalar(select(Admin).where(Admin.council_user_id == owner.user_id)) is None:
            session.add(Admin(date=date.today(), council_user_id=owner.user_id, gss_code=DEMO_GSS, is_approved=True))
        create_demo_points(session, owner, materials, demo_points)

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if admin_email and admin_password:
        if len(admin_password) < 12:
            raise SystemExit("ADMIN_PASSWORD must be at least 12 characters")
        get_or_create_user(
            session,
            admin_email,
            first_name="Site",
            last_name="Admin",
            role="admin",
            hashed_password=get_password_hash(admin_password),
        )

    session.commit()


def main():
    engine = create_engine(database_url_for(os.environ["DATABASE_URL"], "psycopg2"))
    with Session(engine) as session:
        seed(session)
    engine.dispose()
    print("Demo data is in place." + (" Demo accounts are on." if demo_accounts_enabled() else ""))


if __name__ == "__main__":
    main()
