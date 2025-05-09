from pydantic import BaseModel, EmailStr, model_validator, Field
from typing import Optional
import re

class UserRegister(BaseModel):
    """
    Schema for user registration input.

    - Used to validate registration data for both regular and council users.
    - Council users must provide a valid GSS code starting with E/W/S/N followed by 8 digits.
    """
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str
    gss_code: Optional[str] = None

    @model_validator(mode="after")
    def validate_gss_code(cls, values):
        """
        Validates that council users provide a properly formatted GSS code.

        Raises:
            ValueError: If a council user omits the GSS code or provides an invalid format.
        """
        if values.role == "council":
            if not values.gss_code:
                raise ValueError("GSS code is required for council users.")
            if not re.match(r"^[EWSN]\d{8}$", values.gss_code):
                raise ValueError("Invalid GSS code format. Must start with E/W/S/N followed by 8 digits.")
        return values

class Token(BaseModel):
    """
    Schema for authentication token response.

    Returned after successful login to provide access token and user details.
    """
    access_token: str
    token_type: str
    role: str
    email: str
    first_name: str
    last_name: str
    user_id: int
    gss_code: str | None
