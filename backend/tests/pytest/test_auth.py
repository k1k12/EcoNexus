import pytest
from httpx import AsyncClient
from fastapi import status
from sqlalchemy import select, update

from app.database.models import User, Admin


pytestmark = pytest.mark.asyncio

class TestRegisterEndpoint:
    async def test_register_regular_user_success(self, client: AsyncClient, db_session):
        """Test successful registration of a regular user."""
        response = await client.post(
            "/register",
            json={
                "first_name": "New",
                "last_name": "User",
                "email": "newuser@example.com",
                "password": "securepassword",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json() == {"message": "User created successfully"}
        
        # Verify user was created in the database
        result = await db_session.execute(
            select(User).where(User.email == 'newuser@example.com')
        )
        user = result.scalars().first()
        assert user is not None
        assert user.role == "user"
        assert user.is_suspended is False
        
    async def test_register_council_user_success(self, client: AsyncClient, db_session, seed_dependencies):
        """Test successful registration of a council user with valid GSS code."""
        council = seed_dependencies["council"]
        
        response = await client.post(
            "/register",
            json={
                "first_name": "Council",
                "last_name": "Member",
                "email": "council_new@example.com",
                "password": "securepassword",
                "role": "council",
                "gss_code": council.gss_code
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify user was created in the database
        result = await db_session.execute(
            select(User).where(User.email == 'council_new@example.com')
        )
        user = result.scalars().first()
        assert user is not None
        assert user.role == "council"
        assert user.gss_code == council.gss_code
        
        # Verify admin entry was created but not approved
        result = await db_session.execute(
            select(Admin).where(Admin.council_user_id == user.user_id)
        )
        admin_entry = result.scalars().first()
        assert admin_entry is not None
        assert admin_entry.is_approved is False
    
    async def test_register_invalid_email_format(self, client: AsyncClient):
        """Test registration with an invalid email format."""
        response = await client.post(
            "/register",
            json={
                "first_name": "Invalid",
                "last_name": "Email",
                "email": "invalid@site",  # Invalid email format
                "password": "securepassword",
                "role": "user"
            }
        )
        
        # Email validation happens at the Pydantic/FastAPI level
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        response_json = response.json()
        error_message = str(response_json).lower()
        assert "email" in error_message and "valid email" in error_message
    
    async def test_register_duplicate_email(self, client: AsyncClient, db_session):
        """Test registration with an email that already exists."""
        # Use a valid email format
        valid_email = "duplicate.test@example.com"
        
        # First, register a user with this email
        first_response = await client.post(
            "/register",
            json={
                "first_name": "Original",
                "last_name": "User",
                "email": valid_email,
                "password": "securepassword",
                "role": "user"
            }
        )
        
        # Verify the first registration was successful
        assert first_response.status_code == status.HTTP_201_CREATED
        
        # Now try to register again with the same email
        second_response = await client.post(
            "/register",
            json={
                "first_name": "Duplicate",
                "last_name": "Email",
                "email": valid_email,  # Same email
                "password": "differentpassword",
                "role": "user"
            }
        )
        
        # The register_user_db function raises HTTP_400_BAD_REQUEST for duplicate emails
        assert second_response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Check that the response contains an error message about the email
        response_json = second_response.json()
        error_message = str(response_json).lower()
        assert "email" in error_message and ("registered" in error_message or "exists" in error_message)
    
    async def test_register_with_empty_first_name(self, client: AsyncClient):
        """Test registration with empty first name."""
        response = await client.post(
            "/register",
            json={
                "first_name": "",  # Empty first name
                "last_name": "User",
                "email": "empty_first@example.com",
                "password": "securepassword",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
    async def test_register_with_empty_last_name(self, client: AsyncClient):
        """Test registration with empty last name."""
        response = await client.post(
            "/register",
            json={
                "first_name": "Empty",
                "last_name": "",  # Empty last name
                "email": "empty_last@example.com",
                "password": "securepassword",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
    async def test_register_with_short_password(self, client: AsyncClient):
        """Test registration with a password that's too short."""
        response = await client.post(
            "/register",
            json={
                "first_name": "Short",
                "last_name": "Password",
                "email": "short_pass@example.com",
                "password": "short",  # Password too short
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
    async def test_register_with_invalid_role(self, client: AsyncClient, db_session):
        """Test registration with an invalid role."""
        # roles are automatically assigned based on GSS code presence,
        # test that the role field is ignored during registration
        response = await client.post(
        "/register",
            json={
            "first_name": "Invalid",
            "last_name": "Role",
            "email": "invalid_role@example.com",
            "password": "securepassword",
            "role": "superadmin"  # Invalid role, but should be ignored
            }
     )
    
    # Should succeed because role is ignored/overridden
        assert response.status_code == status.HTTP_201_CREATED
    
    # Verify the user was created with the correct role (should be "user")
        result = await db_session.execute(
            select(User).where(User.email == 'invalid_role@example.com')
        )
        user = result.scalars().first()
        assert user is not None
        assert user.role == "user"  # Role should be set to "user" regardless of input
        
    async def test_register_council_with_invalid_gss_format(self, client: AsyncClient):
        """Test registration of council user with invalid GSS code."""

        response = await client.post(
            "/register",
            json={
                "first_name": "Invalid",
                "last_name": "GSS",
                "email": "invalid_gss@example.com",
                "password": "securepassword",
                "role": "council",
                "gss_code": "INVALID123"  # invalid GSS code
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
class TestLoginEndpoint:
    async def test_login_success(self, client: AsyncClient):
        """Test successful login with valid credentials."""
        # Register a new user for testing
        await client.post(
            "/register",
            json={
                "first_name": "Login",
                "last_name": "Test",
                "email": "login_test@example.com",
                "password": "correctpassword",
                "role": "user"
            }
        )
        
        response = await client.post(
            "/login",
            data={
                "username": "login_test@example.com",  # OAuth2 form uses username field
                "password": "correctpassword"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "user"
        assert data["email"] == "login_test@example.com"
        
        # Verify token cookie was set
        assert "access_token" in response.cookies
        cookie_value = response.cookies["access_token"]
        assert "Bearer " in cookie_value
        
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        response = await client.post(
            "/login",
            data={
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        # The login endpoint returns 401 for invalid credentials
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]
        
    async def test_login_suspended_account(self, client: AsyncClient, db_session):
        """Test login with a suspended account."""
        # Register a new user
        await client.post(
            "/register",
            json={
                "first_name": "Suspended",
                "last_name": "User",
                "email": "suspended@example.com",
                "password": "password123",
                "role": "user"
            }
        )
        
        # Suspend the user
        await db_session.execute(
            update(User).where(User.email == 'suspended@example.com').values(is_suspended=True)
        )
        await db_session.commit()
        
        # Try to login
        response = await client.post(
            "/login",
            data={
                "username": "suspended@example.com",
                "password": "password123"
            }
        )
        
        # The login endpoint returns 401 for suspended accounts
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Account is suspended" in response.json()["detail"]
        
    async def test_login_unapproved_council(self, client: AsyncClient, seed_dependencies):
        """Test login with an unapproved council account."""
        council = seed_dependencies["council"]
    
        # Register a new council user
        email = "new_unapproved@example.com"
        password = "securepassword"
    
        # Register the council user
        await client.post(
        "/register",
            json={
            "first_name": "New",
            "last_name": "Unapproved",
            "email": email,
            "password": password,
            "role": "council",
            "gss_code": council.gss_code
            }
        )
    
        # Try to login with the new council user (should fail because it's not approved)
        response = await client.post(
            "/login",
            data={
            "username": email,
            "password": password
            }
        )
    
        # API should return 401 Unauthorized for unapproved council account
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Council account not yet approved"

class TestLogoutEndpoint:
    async def test_logout_success(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test successful logout."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        response = await client.post(
            "/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"message": "Successfully logged out"}
        
        # Check for Set-Cookie header
        headers = {k.lower(): v for k, v in response.headers.items()}
        assert "set-cookie" in headers
        
    async def test_logout_unauthenticated(self, client: AsyncClient):
        """Test logout without authentication."""
        response = await client.post("/logout")
        
        # The logout endpoint requires authentication
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    async def test_logout_with_invalid_token(self, client: AsyncClient):
        """Test logout with an invalid token."""
        response = await client.post(
            "/logout",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserInfoEndpoint:
    async def test_user_info_success(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test getting user info with valid token."""
        user = seed_dependencies["user"]
        token = generate_testing_token(
            user.email, 
            user.role, 
            {"user_id": user.user_id}
        )
        
        response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == user.user_id
        assert data["role"] == user.role
        assert data["email"] == user.email
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name
        
    async def test_user_info_council_user(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test getting user info for council user."""
        council_user = seed_dependencies["council_user"]
        token = generate_testing_token(
            council_user.email, 
            council_user.role, 
            {"user_id": council_user.user_id, "gss_code": council_user.gss_code}
        )
        
        response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == council_user.user_id
        assert data["role"] == "council"
        assert data["gss_code"] == council_user.gss_code
        
    async def test_user_info_unauthenticated(self, client: AsyncClient):
        """Test getting user info without authentication."""
        response = await client.get("/user-info")
        
        # The user-info endpoint requires authentication
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    async def test_user_info_admin_user(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test getting user info for admin user."""
        admin_user = seed_dependencies["admin_user"]
        token = generate_testing_token(
            admin_user.email, 
            admin_user.role, 
            {"user_id": admin_user.user_id}
        )
        
        response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == admin_user.user_id
        assert data["role"] == "admin"
        
    async def test_user_info_with_cookie_auth(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test getting user info using cookie authentication."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        response = await client.get(
            "/user-info",
            cookies={"access_token": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == user.user_id


class TestSecurityFeatures:
    async def test_token_in_cookie_vs_header(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test that token works both in cookie and Authorization header."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        # Test with Authorization header
        header_response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert header_response.status_code == status.HTTP_200_OK
        
        # Test with cookie
        cookie_response = await client.get(
            "/user-info",
            cookies={"access_token": f"Bearer {token}"}
        )
        assert cookie_response.status_code == status.HTTP_200_OK
        
    async def test_invalid_token_signature(self, client: AsyncClient):
        """Test that a token with invalid signature is rejected."""
        # Create a token with an invalid signature
        invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.INVALID_SIGNATURE"
        
        response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    async def test_tampered_token_payload(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test that a token with tampered payload is rejected."""
        user = seed_dependencies["user"]
        # Generate a valid token first
        valid_token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        # Tamper with the token by changing the middle part (payload)
        parts = valid_token.split('.')
        tampered_token = f"{parts[0]}.eyJzdWIiOiJoYWNrZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.{parts[2]}"
        
        response = await client.get(
            "/user-info",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED