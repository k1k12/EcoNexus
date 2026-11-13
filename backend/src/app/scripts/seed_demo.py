"""Seed a live database with demo data.

Safe to run on every deploy: it only adds what's missing and never deletes.
Unlike tests/manual/db/populate_tables.py it creates no accounts with known
passwords. The demo council account gets a random password nobody knows, and
an admin is only made if ADMIN_EMAIL and ADMIN_PASSWORD are set.

Run from backend/: PYTHONPATH=src python -m app.scripts.seed_demo
"""
import os
import secrets
from datetime import date

from dotenv import load_dotenv
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.db_url import database_url_for
from app.core.utils import get_password_hash
from app.database.models import Admin, Council, Material, Product, RecyclingPoint, User
from app.scripts.materials_data import MATERIALS

load_dotenv()

DEMO_GSS = "E08000021"
DEMO_COUNCIL_EMAIL = "demo-council@econexus.invalid"

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


def seed(session: Session):
    if session.get(Council, DEMO_GSS) is None:
        session.add(Council(gss_code=DEMO_GSS, name="Newcastle upon Tyne (demo area)", lon_lat_points=DEMO_AREA))
        session.flush()

    materials = get_or_create_materials(session)

    council_user = get_or_create_user(
        session,
        DEMO_COUNCIL_EMAIL,
        first_name="Demo",
        last_name="Council",
        role="council",
        gss_code=DEMO_GSS,
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
    )
    if session.scalar(select(Admin).where(Admin.council_user_id == council_user.user_id)) is None:
        session.add(Admin(date=date.today(), council_user_id=council_user.user_id, gss_code=DEMO_GSS, is_approved=True))

    has_points = session.scalar(select(RecyclingPoint).where(RecyclingPoint.gss_code == DEMO_GSS).limit(1))
    if has_points is None:
        for lat, lon, names in POINTS:
            session.add(RecyclingPoint(
                latitude=lat,
                longitude=lon,
                user_id=council_user.user_id,
                gss_code=DEMO_GSS,
                times_open=OPENING_TIMES,
                materials=[materials[n] for n in names],
            ))

    for barcode, name, material, recyclable in PRODUCTS:
        if session.get(Product, barcode) is None:
            session.add(Product(barcode=barcode, name=name, material_id=materials[material].material_id, recyclable=recyclable))

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
    print("Demo data is in place.")


if __name__ == "__main__":
    main()
