from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.database import SessionLocal
from app.database.crud.auth import get_user_by_email
from app.database.models import User
from app.core.security import get_raw_token
from typing import AsyncGenerator
from app.database.crud.auth import check_email_exists

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.

    Yields:
        AsyncSession: An async SQLAlchemy session for DB operations.
    """
    async with SessionLocal() as db:
        yield db

async def get_current_user(token: str = Depends(get_raw_token), db: Session = Depends(get_db)) -> User:
    """
    Dependency that extracts and returns the current authenticated user.

    - Decodes the JWT token using the secret key and algorithm.
    - Fetches the user by email from the token payload.
    - Rejects the request if the token is invalid or the user is suspended.

    Args:
        token (str): JWT token from header or cookie.
        db (Session): Database session.

    Returns:
        User: The current authenticated user.

    Raises:
        HTTPException: If token is invalid or user not found/suspended.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(db, email=email)
    if user is None or user.is_suspended:
        raise credentials_exception
    
    return user

async def validate_unique_email(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to validate that an email doesn't already exist in the database.
    Returns a 400 error if the email exists.
    """
    if await check_email_exists(db, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return email