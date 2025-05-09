from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from app.api.dependencies import get_db, validate_unique_email

from app.core.security import (
    authenticate_user, 
    create_access_token,
)
from app.core.config import settings
from app.api.dependencies import get_db, get_current_user
from app.database.models import User
from app.schemas.auth import UserRegister, Token
from app.database.crud.auth import (register_user_db, 
                                    get_user_is_approved_db)

router = APIRouter(tags=["authentication"])

# Endpoints
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user (council or regular).

    - Validates that the email is not already taken.
    - Creates a new user record in the database.
    - If the user is a council member, also prepares an approval entry.

    Args:
        user (UserRegister): User registration details.
        db (AsyncSession): Database session.

    Returns:
        dict: Success message after user creation.
    """

    await validate_unique_email(user.email, db)
    
    await register_user_db(db, user.dict())
    return {"message": "User created successfully"}


@router.post("/login", response_model=Token)
async def login_for_access_token(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)):

    """
    Authenticate the user and return a JWT access token.

    - Accepts credentials (email as username).
    - Checks suspension status and council approval.
    - Generates and sets an HTTP-only cookie with the JWT token.

    Args:
        response (Response): Response object for setting cookies.
        form_data (OAuth2PasswordRequestForm): Form data with username and password.
        db (AsyncSession): Database session.

    Returns:
        dict: Access token and user metadata.
    
    Raises:
        HTTPException: If credentials are invalid, user is suspended,
                       or a council user is not yet approved.
    """
    
    user = await authenticate_user(db, form_data.username, form_data.password) # treating username as email
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is suspended
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is suspended",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Council user can't login until approved
    if user.role == "council":
        if not await get_user_is_approved_db(db, user.user_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Council account not yet approved",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={
        "sub": user.email,
        "role": user.role,
        "user_id": user.user_id,
        },
        expires_delta=access_token_expires
    )

    # Set token as HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,
        expires=1800,
        samesite="lax",
        secure=False  
        # for production secure will need to be true 
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "user_id": user.user_id,
        "gss_code": user.gss_code
    }

@router.post("/logout", dependencies=[Depends(get_current_user)])
async def logout(response: Response):
    """
    Logout the current user by deleting the access token cookie.

    Args:
        response (Response): The response object used to clear the cookie.

    Returns:
        dict: Confirmation message.
    """
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

@router.get("/user-info", dependencies=[Depends(get_current_user)])
async def user_info(user: User = Depends(get_current_user)):
    """
    Retrieve the authenticated user's information.

    Args:
        user (User): The current authenticated user (injected via dependency).

    Returns:
        dict: Basic user profile information.
    """
    return {
        "user_id": user.user_id,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "gss_code": user.gss_code or None
    }
