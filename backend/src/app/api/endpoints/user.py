from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import check_permission
from app.database.models import User
from app.database.crud.auth import (get_user_by_id, 
                               check_email_exists, 
                               update_user,
                               get_user_by_id,
                               delete_user)
from app.api.dependencies import get_db, get_current_user
from app.core.demo import is_demo_email

from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(tags=["users"])


def check_demo_access(current_user: User, target_user: User, changing: bool):
    """Keep the public demo logins to themselves and stop anyone changing them."""
    if is_demo_email(current_user.email) and current_user.user_id != target_user.user_id:
        raise HTTPException(status_code=403, detail="Demo accounts can only see their own account")
    if changing and is_demo_email(target_user.email):
        raise HTTPException(status_code=403, detail="Demo accounts can't be changed")

# Endpoints
@router.get("/account/{user_id}", response_model=UserResponse)
async def get_user_account(
    user_id: int, 
    current_user = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)):

    """
    Retrieve a user's account details by user ID.

    - Only admins or the user themselves can access the data.
    - Returns user details if found and authorized.

    Args:
        user_id (int): ID of the user whose account is being requested.
        current_user (User): Authenticated user (injected).
        db (AsyncSession): Database session.

    Returns:
        UserResponse: The user's profile data.

    Raises:
        HTTPException: 404 if user not found, 403 if unauthorized.
    """
    
    # Check if user exists
    user = await get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user has permission to view this account
    if not await check_permission(current_user, user_id):
        raise HTTPException(status_code=403, detail="Not authorised to access this account")

    check_demo_access(current_user, user, changing=False)
    
    return user

@router.patch("/account/{user_id}")
async def update_user_account(
    user_id: int, 
    user_update: UserUpdate, 
    current_user = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's account details.

    - Only admins or the user themselves can update.
    - Checks for email conflicts and partial updates.

    Args:
        user_id (int): ID of the user to update.
        user_update (UserUpdate): Fields to update.
        current_user (User): Authenticated user.
        db (AsyncSession): Database session.

    Returns:
        dict: Confirmation message.

    Raises:
        HTTPException: 404 if user not found, 403 if unauthorized,
                       400 if email is already taken.
    """
    # Check if user exists
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user has permission to modify this account
    if not await check_permission(current_user, user_id):
        raise HTTPException(status_code=403, detail="Not authorised to modify this account")

    check_demo_access(current_user, user, changing=True)
    
    # Only admins can change a role or council, otherwise anyone could make themselves an admin
    if current_user.role != "admin" and (user_update.role is not None or user_update.gss_code is not None):
        raise HTTPException(status_code=403, detail="Only admins can change roles or councils")

    if user_update.role is not None and user_update.role not in ("user", "council", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    # Check for email conflict
    if user_update.email and await check_email_exists(db, user_update.email, exclude_user_id=user_id):
        raise HTTPException(status_code=400, detail="Email already taken")

    user_data = user_update.dict(exclude_unset=True)
    await update_user(db, user_id, user_data)
    
    return {"message": "User updated successfully"}

@router.delete("/account/{user_id}")
async def delete_user_account(
    user_id: int, 
    current_user = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user's account.

    - Only admins or the user themselves can delete.
    - Permanently removes the user record from the database.

    Args:
        user_id (int): ID of the user to delete.
        current_user (User): Authenticated user.
        db (AsyncSession): Database session.

    Returns:
        dict: Confirmation message.

    Raises:
        HTTPException: 404 if user not found, 403 if unauthorized,
                       500 if deletion fails.
    """

    # Check if user exists
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user has permission to delete this account
    if not await check_permission(current_user, user_id):
        raise HTTPException(status_code=403, detail="Not authorised to delete this account")

    check_demo_access(current_user, user, changing=True)
    
    # Delete the user
    success = await delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="User could not be deleted")