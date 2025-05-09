#!/usr/bin/env python3
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.database.models import Base

load_dotenv()

def get_sync_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set in your environment.")
    return db_url.replace("postgresql+asyncpg", "postgresql+psycopg2")

def clear_all_tables(engine):
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(text("SET session_replication_role = 'replica';"))

            # Drop all data from all tables (in correct FK order)
            for table in reversed(Base.metadata.sorted_tables):
                print(f"Clearing table: {table.name}")
                conn.execute(table.delete())

            conn.execute(text("SET session_replication_role = 'origin';"))
            trans.commit()
            print("All tables cleared successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Error clearing tables: {e}")
            raise

def main():
    db_url = get_sync_database_url()
    engine = create_engine(db_url, echo=False)
    clear_all_tables(engine)

if __name__ == "__main__":
    main()
