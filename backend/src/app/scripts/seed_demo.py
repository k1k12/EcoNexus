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
import os
import secrets
from datetime import date, datetime, timedelta

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

# Rough box around central Newcastle, not the real council boundary
DEMO_AREA = [[-1.70, 55.01], [-1.55, 55.01], [-1.55, 54.95], [-1.70, 54.95], [-1.70, 55.01]]

WEEKDAYS = {d: ["08:00", "18:00"] for d in ["monday", "tuesday", "wednesday", "thursday", "friday"]}
OPENING_TIMES = {**WEEKDAYS, "saturday": ["09:00", "16:00"], "sunday": ["Closed", "Closed"]}

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

# (days ago, product barcode, point index, quantity) for the demo user's dashboard
DEMO_HISTORY = [
    (1, "5449000000996", 2, 3),
    (2, "3029330003533", 0, 1),
    (4, "5449000000996", 1, 2),
    (6, "5000159484695", 3, 1),
    (9, "3029330003533", 0, 2),
]


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


def create_demo_points(session: Session, owner: User, materials: dict) -> list:
    points = []
    for lat, lon, names in POINTS:
        point = RecyclingPoint(
            latitude=lat,
            longitude=lon,
            user_id=owner.user_id,
            gss_code=DEMO_GSS,
            times_open=OPENING_TIMES,
            materials=[materials[n] for n in names],
        )
        session.add(point)
        points.append(point)
    session.flush()
    return points


def create_demo_history(session: Session, user: User, points: list):
    now = datetime.now().replace(microsecond=0)
    for days_ago, barcode, point_index, quantity in DEMO_HISTORY:
        when = now - timedelta(days=days_ago)
        point_id = points[point_index].point_id
        session.add(RecycleHistory(date=when, user_id=user.user_id, point_id=point_id))
        session.flush()
        session.add(RecycleHistoryProductAssociation(
            date=when, user_id=user.user_id, product_barcode=barcode, point_id=point_id, quantity=quantity,
        ))


def seed(session: Session):
    if session.get(Council, DEMO_GSS) is None:
        session.add(Council(gss_code=DEMO_GSS, name="Newcastle upon Tyne (demo area)", lon_lat_points=DEMO_AREA))
        session.flush()

    materials = get_or_create_materials(session)

    for barcode, name, material, recyclable in PRODUCTS:
        if session.get(Product, barcode) is None:
            session.add(Product(barcode=barcode, name=name, material_id=materials[material].material_id, recyclable=recyclable))
    session.flush()

    clear_demo_area_and_accounts(session)

    if demo_accounts_enabled():
        accounts = create_demo_accounts(session)
        points = create_demo_points(session, accounts["council"], materials)
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
        create_demo_points(session, owner, materials)

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
