from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# Hosted Postgres (Neon, Render, Supabase) hands out plain postgres:// urls with
# sslmode=require. asyncpg wants ssl=require instead, and psycopg2 wants sslmode,
# so this turns one url into the right form for each driver.
DRIVERS = {"asyncpg": "postgresql+asyncpg", "psycopg2": "postgresql+psycopg2"}


def database_url_for(url: str, driver: str) -> str:
    parts = urlsplit(url)
    params = dict(parse_qsl(parts.query))

    ssl = params.pop("sslmode", None) or params.pop("ssl", None)
    # Neither driver understands channel_binding, and TLS still applies without it
    params.pop("channel_binding", None)
    if ssl:
        params["ssl" if driver == "asyncpg" else "sslmode"] = ssl

    return urlunsplit((DRIVERS[driver], parts.netloc, parts.path, urlencode(params), parts.fragment))
