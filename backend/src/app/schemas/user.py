from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional

class UserUpdate(BaseModel):
    """
    Schema for updating a user's account information.

    Allows partial updates of user fields.
    All fields are optional, but empty strings are not allowed.
    """
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    gss_code: Optional[str] = None
    role: Optional[str] = None

    @field_validator('first_name', 'last_name', 'password', 'gss_code', 'role')
    @classmethod
    def no_empty_strings(cls, v):
        """ Validator to prevent empty strings on fields.
        
        Raises:
            ValueError: If a non-null field is an empty string.
        """
        if v is not None and v == "":
            raise ValueError("Field cannot be empty")
        return v

class UserResponse(BaseModel):
    """
    Schema for returning user profile information.

    Used in API responses to provide public user data.
    """
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    is_suspended: bool
    mfa_key: str
    gss_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
