# src/app/core/security.py

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security.utils import get_authorization_scheme_param
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.utils import verify_password
from app.database.models import User

from fastapi.security import OAuth2PasswordBearer

# auto_error = false makes it to NOT throw any exceptions, returning None on failure instead
# this is to allows us to inspect cookies if tokens hansn't been found in the header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

def get_token_from_cookie(request: Request) -> Optional[str]:
    """
    Retrieve a JWT access token from the 'access_token' cookie.

    This function attempts to extract a Bearer token from the request's cookies.
    It expects the cookie value to follow the "Bearer <token>" format.

    Args:
        request (Request): The incoming FastAPI request.

    Returns:
        Optional[str]: The token if found and valid, otherwise None.
    """
    cookie = request.cookies.get("access_token")
    if not cookie:
        return None
    scheme, token = get_authorization_scheme_param(cookie)
    if scheme.lower() != "bearer":
        return None
    return token

def get_raw_token(
        request: Request,
        header_token: Optional[str] = Depends(oauth2_scheme)
        ) -> Optional[str]:
     
    """
    Retrieve the JWT token from the Authorization header or cookie.

    This function first attempts to get the token from the Authorization header.
    If not present, it falls back to checking the 'access_token' cookie.

    Args:
        request (Request): The current request object.
        header_token (Optional[str]): Token from the Authorization header (injected by FastAPI).

    Returns:
        Optional[str]: A valid JWT token if found.

    Raises:
        HTTPException: If no valid token is found. """
    
    if header_token: return header_token

    cookie_token = get_token_from_cookie(request)
    if cookie_token:
        return cookie_token

    raise HTTPException(status_code=401, detail="Not authorized")

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token with optional expiration.

    Encodes the given payload into a JWT token, adding an expiration time.
    The token is signed using the configured secret key and algorithm.

    Args:
        data (dict): The payload data to include in the token.
        expires_delta (Optional[timedelta]): Optional custom expiration time.

    Returns:
        str: The encoded JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """
    Fetch a user from the database by their email address.

    Args:
        db (AsyncSession): SQLAlchemy async database session.
        email (str): Email address to search for.

    Returns:
        Optional[User]: The User object if found, otherwise None.
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """
    Authenticate a user by verifying their email and password.

    Args:
        db (AsyncSession): SQLAlchemy async database session.
        email (str): The user's email address.
        password (str): The user's plain-text password.

    Returns:
        Optional[User]: The authenticated User object, or None if authentication fails.
    """
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def get_token_from_request(request: Request) -> str:
    """
    Retrieve a JWT token from the request's header or cookie.

    This is a lower-level utility for extracting tokens.
    It first looks in the Authorization header, then in cookies.

    Args:
        request (Request): The incoming FastAPI request.

    Returns:
        str: The JWT token string if found.

    Raises:
        HTTPException: If no valid Bearer token is found in either place.
    """
    auth = request.headers.get("Authorization")
    scheme, param = get_authorization_scheme_param(auth)
    if scheme.lower() == "bearer" and param:
        return param

    cookie = request.cookies.get("access_token")
    scheme, param = get_authorization_scheme_param(cookie)
    if scheme.lower() == "bearer" and param:
        return param

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def check_permission(current_user: User, target_user_id: int) -> bool:
    """
    Determine whether a user has permission to access another user's data.

    Admins have full access. Regular users can only access their own data.

    Args:
        current_user (User): The current authenticated user.
        target_user_id (int): The user ID of the target resource.

    Returns:
        bool: True if the user has permission, otherwise False.
    """
    if current_user.role == "admin":
        return True
    return current_user.user_id == target_user_id

async def check_council_association(user: User, gss_code: str) -> bool:
    """
    Check if a user is associated with a specific council by GSS code.

    Args:
        user (User): The user to check.
        gss_code (str): The GSS code to match.

    Returns:
        bool: True if the user is part of the specified council.
    """
    return user.gss_code == gss_code

async def check_point_association(current_user: User, recycling_point) -> bool:
    """
    Check if the user can manage a recycling point.

    Admins can manage any point.
    Council users can manage points only within their own GSS code.

    Args:
        current_user (User): The authenticated user.
        recycling_point: The recycling point object (must have a 'gss_code' attribute).

    Returns:
        bool: True if the user is allowed to manage the point.
    """
    # Allows council users to manage points in their own GSS code
    return (
        current_user.role == "admin"
        or (
            current_user.role == "council"
            and current_user.gss_code == getattr(recycling_point, "gss_code", None)
        )
    )
