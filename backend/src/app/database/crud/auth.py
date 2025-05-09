from datetime import date
from typing import Optional, Union

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User, Admin, Council
from app.core.utils import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """
    Retrieve a user by their email address.

    Args:
        db (AsyncSession): The async database session.
        email (str): Email address to search for.

    Returns:
        Optional[User]: User object if found, otherwise None.
    """
    q = select(User).filter(User.email == email)
    result = await db.execute(q)
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """
    Retrieve a user by their user ID.

    Args:
        db (AsyncSession): The async database session.
        user_id (int): ID of the user to retrieve.

    Returns:
        Optional[User]: User object if found, otherwise None.
    """
    q = select(User).filter(User.user_id == user_id)
    result = await db.execute(q)
    return result.scalars().first()

async def get_user_is_approved_db(
    db: AsyncSession, user_or_id: Union[int, User]
) -> bool:
    """
    Check if a council user is approved.

    Args:
        db (AsyncSession): The async database session.
        user_or_id (Union[int, User]): A user object or user ID.

    Returns:
        bool: True if the user is approved, False otherwise.
    """
    # allow passing User or int
    uid = user_or_id.user_id if hasattr(user_or_id, "user_id") else user_or_id
    result = await db.execute(
        select(Admin)
        .where(Admin.council_user_id == uid, Admin.is_approved.is_(True))
    )
    return result.scalars().first() is not None

async def check_email_exists(
    db: AsyncSession, email: str, exclude_user_id: Optional[int] = None
) -> bool:
    """
    Check if an email is already used by another user.

    Args:
        db (AsyncSession): The async database session.
        email (str): Email address to check.
        exclude_user_id (Optional[int]): Optional user ID to exclude from the check.

    Returns:
        bool: True if email exists, otherwise False.
    """
    q = select(User).filter(User.email == email)
    if exclude_user_id:
        q = q.filter(User.user_id != exclude_user_id)
    result = await db.execute(q)
    return result.scalars().first() is not None


async def register_user_db(db: AsyncSession, user_data: dict) -> User:
    """
    Register a new user and optionally create an admin record for council users.

    Args:
        db (AsyncSession): The async database session.
        user_data (dict): Dictionary containing user registration fields.

    Returns:
        User: The newly created user object.

    Raises:
        HTTPException: If the GSS code is invalid for council users.
    """

    # Hash password and create User instance
    role = "council" if user_data.get("gss_code") else "user"
    new_user = User(
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
        email=user_data["email"],
        hashed_password=get_password_hash(user_data["password"]),
        role=role,
        is_suspended=False,
        mfa_key="",
        gss_code=user_data.get("gss_code"),
    )

    # Add and flush to get user_id
    db.add(new_user)
    await db.flush()

    # If council signup, validate GSS and prepare Admin
    if new_user.gss_code:
        # Validate council exists
        q = select(Council).filter(Council.gss_code == new_user.gss_code)
        council_res = await db.execute(q)
        if not council_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid GSS code"
            )

        # Create admin row
        admin_entry = Admin(
            date=date.today(),
            council_user_id=new_user.user_id,
            gss_code=new_user.gss_code,
            is_approved=False,
        )
        db.add(admin_entry)

    # Commit all changes
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    """
    Authenticate a user using their email and password.

    Args:
        db (AsyncSession): The async database session.
        email (str): Email address.
        password (str): Plain-text password.

    Returns:
        Optional[User]: User if credentials are valid, otherwise None.
    """
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def update_user(
    db: AsyncSession, user_id: int, user_data: dict
) -> Optional[User]:
    """
    Update fields for an existing user.

    Args:
        db (AsyncSession): The async database session.
        user_id (int): ID of the user to update.
        user_data (dict): Dictionary of fields to update.

    Returns:
        Optional[User]: Updated user object, or None if user doesn't exist.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    # Handle password separately
    if "password" in user_data:
        user.hashed_password = get_password_hash(user_data.pop("password"))

    # Update other fields
    for field, value in user_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: int) -> bool:
    """
    Delete a user from the database.

    Args:
        db (AsyncSession): The async database session.
        user_id (int): ID of the user to delete.

    Returns:
        bool: True if user was deleted, False if user wasn't found.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    await db.delete(user)
    await db.commit()
    return True
