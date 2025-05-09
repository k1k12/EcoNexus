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

from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(tags=["users"])

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
    
    # Delete the user
    success = await delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="User could not be deleted")