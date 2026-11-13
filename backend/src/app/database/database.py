from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv
from app.core.db_url import database_url_for
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set, copy backend/.env.example to backend/.env")

engine = create_async_engine(
    database_url_for(DATABASE_URL, "asyncpg"),
    # SQL logging is noisy and can print user data, so it's off unless asked for
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    # Free hosted databases only allow a few connections, so keep the pool small there
    pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
    max_overflow=0,
    pool_pre_ping=True,
    )

SessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
    )

Base = declarative_base()
