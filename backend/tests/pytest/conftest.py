import gc
import os
import sys
import tempfile
import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta, date
from typing import Optional
import time

from jose import jwt
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, close_all_sessions

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from main import app
from app.api.dependencies import get_db
from app.database.database import Base
from app.database.models import (
    User,
    Material,
    Council,
    RecyclingPoint,
    Product,
    Admin,
    recycling_point_material_association,
)
from app.core.config import settings

# ─── Database URLs ──────────────────────────────────────────────────────────
_db_fd, _db_file = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
SYNC_DB_URL = f"sqlite:///{_db_file}"
ASYNC_DB_URL = f"sqlite+aiosqlite:///{_db_file}"

# ─── Engines ────────────────────────────────────────────────────────────────
sync_engine = create_engine(
    SYNC_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SyncSessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)

async_engine = create_async_engine(
    ASYNC_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)
AsyncSessionLocal = sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)

# ─── Database Setup ─────────────────────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=sync_engine)
    yield
    Base.metadata.drop_all(bind=sync_engine)

    sync_engine.dispose()
    async_engine.dispose()
    close_all_sessions()

    gc.collect()

    for _ in range(10):
        try:
            os.remove(_db_file)
            break
        except PermissionError:
            time.sleep(0.2)
    else:
        raise RuntimeError(f"Failed to remove the database file after 10 attempts: {_db_file}")

# ─── Database Session Fixtures ──────────────────────────────────────────────
@pytest_asyncio.fixture
async def db_session():
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()
        await async_engine.dispose()

@pytest.fixture(autouse=True)
def override_get_db():
    async def _override():
        async with AsyncSessionLocal() as session:
            yield session
    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.pop(get_db, None)

# ─── HTTP Client ────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cli:
        yield cli

# ─── JWT Helper ─────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@pytest.fixture
def generate_testing_token():
    def _gen(email: str, role: str = "user", extra_claims: dict = None):
        payload = {"sub": email, "role": role}
        if extra_claims:
            payload.update(extra_claims)
        return create_access_token(payload)
    return _gen

# @pytest.fixture(autouse=True)
# def _respx_mock():
#     with respx.mock(assert_all_mocked=False):
#         yield

# ─── User Role Overrides (for Authenticated Routes) ─────────────────────────
@pytest.fixture
def override_get_current_user_council(monkeypatch, seed_dependencies):
    def _override():
        return seed_dependencies["council_user"]
    monkeypatch.setattr("app.api.dependencies.get_current_user", _override)

@pytest.fixture
def override_get_current_user(monkeypatch, seed_dependencies):
    def _override():
        return seed_dependencies["user"]
    monkeypatch.setattr("app.api.dependencies.get_current_user", _override)

@pytest.fixture
def override_get_current_unauth_user(monkeypatch, seed_dependencies):
    def _override():
        return seed_dependencies["unauth_user"]
    monkeypatch.setattr("app.api.dependencies.get_current_user", _override)

# ─── Seed Data ──────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def seed_dependencies(db_session):
    # Clear all tables
    await db_session.execute(recycling_point_material_association.delete())
    await db_session.execute(RecyclingPoint.__table__.delete())
    await db_session.execute(Admin.__table__.delete())
    await db_session.execute(Material.__table__.delete())
    await db_session.execute(User.__table__.delete())
    await db_session.execute(Council.__table__.delete())
    await db_session.execute(Product.__table__.delete())
    await db_session.commit()

    # Create models
    admin_user = User(
        first_name="Test", last_name="Admin", email="sofia@issick.oftests.com",
        hashed_password="secret", role="admin", is_suspended=False, mfa_key="123456",
    )
    council_user = User(
        first_name="Leader", last_name="Council", email="council@site.com",
        hashed_password="secret", role="council", is_suspended=False, mfa_key="654321", gss_code="E08000012",
    )
    council_user2 = User(
        first_name="Un", last_name="Approved", email="c2@site.com",
        hashed_password="secret", role="council", is_suspended=False, mfa_key="000000", gss_code="E08000012",
    )
    user = User(
        first_name="Regular", last_name="User", email="user@site.com",
        hashed_password="secret", role="user", is_suspended=False, mfa_key="111111",
    )
    unauth_user = User(
        first_name="Guest", last_name="User", email="guest@site.com",
        hashed_password="secret", role="guest", is_suspended=False, mfa_key="222222",
    )

    material_plastic = Material(name="plastic", synonyms=["plastic", "PET"])
    material_glass = Material(name="glass", synonyms=["glass", "GL"])
    material_paper = Material(name="paper", synonyms=["paper", "pap"])

    council = Council(name="46CPC", gss_code="E08000012", lon_lat_points={})

    db_session.add_all([
        admin_user, council_user, council_user2, user, unauth_user,
        material_plastic, material_paper, material_glass, 
        council
    ])
    await db_session.flush()

    rp1 = RecyclingPoint(
        user_id=council_user.user_id, gss_code=council.gss_code,
        latitude=54.985449, longitude=-1.609476,
        times_open={d: ("00:00", "12:00") for d in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]} | {"sunday": ("Closed", "Closed")},
    )
    rp2 = RecyclingPoint(
        user_id=council_user.user_id, gss_code=council.gss_code,
        latitude=1.0, longitude=0.0,
        times_open=rp1.times_open,
    )

    admin1 = Admin(date=date.today(), council_user_id=council_user.user_id, gss_code=council.gss_code, is_approved=True)
    admin2 = Admin(date=date.today(), council_user_id=council_user2.user_id, gss_code=council.gss_code, is_approved=False)

    db_session.add_all([rp1, rp2, admin1, admin2])

    rp1.materials.extend([material_plastic, material_paper, material_glass])  # <<< ADD glass to point
    rp2.materials.append(material_plastic)

    await db_session.flush()

    product = Product(barcode="5012345678917", name="Test Product", material_id=material_plastic.material_id)
    db_session.add(product)

    await db_session.commit()

    await db_session.refresh(product)
    await db_session.refresh(rp1)
    await db_session.refresh(rp2)

    return {
        "admin_user": admin_user,
        "council_user": council_user,
        "council_user2": council_user2,
        "user": user,
        "unauth_user": unauth_user,
        "material": material_plastic,
        "material2": material_paper,
        "material3": material_glass,
        "council": council,
        "product": product,
        "point": rp1,
        "point2": rp2,
        "admin_entry": admin1,
        "admin_entry2": admin2,
        "test_db": db_session,
    }
