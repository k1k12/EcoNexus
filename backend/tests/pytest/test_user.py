import pytest
from fastapi import status
from sqlalchemy import select
from datetime import date
from httpx import AsyncClient

from app.database.models import User, Admin, Council
from app.core.utils import verify_password, get_password_hash

pytestmark = pytest.mark.asyncio

class TestGetUserAccount:
    async def test_get_own_account_success(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test successfully retrieving own user account."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        response = await client.get(
            f"/account/{user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == user.user_id
        assert data["email"] == user.email
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name
        assert data["role"] == user.role
        assert "is_suspended" in data
        assert "mfa_key" in data
    
    async def test_admin_get_other_account(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test admin successfully retrieving another user's account."""
        admin_user = seed_dependencies["admin_user"]
        regular_user = seed_dependencies["user"]
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        response = await client.get(
            f"/account/{regular_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == regular_user.user_id
        assert data["email"] == regular_user.email
    
    async def test_user_get_other_account_forbidden(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test regular user cannot retrieve another user's account."""
        user = seed_dependencies["user"]
        other_user = seed_dependencies["unauth_user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        response = await client.get(
            f"/account/{other_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorised" in response.json()["detail"]
    
    async def test_get_nonexistent_account(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test retrieving a non-existent user account."""
        admin_user = seed_dependencies["admin_user"]
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        # Use a non-existent user ID
        non_existent_id = 9999
        
        response = await client.get(
            f"/account/{non_existent_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "User not found" in response.json()["detail"]
    
    async def test_get_council_user_account(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test retrieving a council user account with GSS code."""
        council_user = seed_dependencies["council_user"]
        token = generate_testing_token(council_user.email, council_user.role, {"user_id": council_user.user_id})
        
        response = await client.get(
            f"/account/{council_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == council_user.user_id
        assert data["role"] == "council"
        assert data["gss_code"] == council_user.gss_code


class TestUpdateUserAccount:
    async def test_update_own_account_success(self, client: AsyncClient, generate_testing_token, db_session):
        """Test successfully updating own user account."""
        # Create a new user specifically for this test to avoid conflicts
        new_user = User(
            first_name="Update", 
            last_name="Test", 
            email="update.test@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        update_data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"message": "User updated successfully"}
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(new_user)
        
        # Verify the user was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
    
    async def test_update_email_success(self, client: AsyncClient, generate_testing_token, db_session):
        """Test successfully updating email."""
        # Create a new user specifically for this test
        new_user = User(
            first_name="Email", 
            last_name="Test", 
            email="email.test@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        new_email = "updated.email@example.com"
        update_data = {
            "email": new_email
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(new_user)
        
        # Verify the email was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.email == new_email
    
    async def test_update_password_success(self, client: AsyncClient, generate_testing_token, db_session):
        """Test successfully updating password."""
        # Create a new user with a properly hashed password
        original_password = "originalPassword123"
        hashed_password = get_password_hash(original_password)
        
        new_user = User(
            first_name="Password", 
            last_name="Test", 
            email="password.test@example.com",
            hashed_password=hashed_password, 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        new_password = "newSecurePassword123"
        update_data = {
            "password": new_password
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(new_user)
        
        # Verify the password was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        updated_user = result.scalars().first()
        
        # Verify the new password works with the updated hash
        assert verify_password(new_password, updated_user.hashed_password)
        # Verify the old password no longer works
        assert not verify_password(original_password, updated_user.hashed_password)
    
    async def test_admin_update_other_account(self, client: AsyncClient, generate_testing_token, seed_dependencies, db_session):
        """Test admin successfully updating another user's account."""
        # Create a new user specifically for this test
        new_user = User(
            first_name="Admin", 
            last_name="Target", 
            email="admin.target@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Use admin token
        admin_user = seed_dependencies["admin_user"]
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        update_data = {
            "first_name": "Admin",
            "last_name": "Updated"
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(new_user)
        
        # Verify the user was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.first_name == "Admin"
        assert updated_user.last_name == "Updated"
    
    async def test_user_update_other_account_forbidden(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test regular user cannot update another user's account."""
        user = seed_dependencies["user"]
        other_user = seed_dependencies["unauth_user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        update_data = {
            "first_name": "Unauthorized",
            "last_name": "Update"
        }
        
        response = await client.patch(
            f"/account/{other_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorised" in response.json()["detail"]
    
    async def test_update_nonexistent_account(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test updating a non-existent user account."""
        admin_user = seed_dependencies["admin_user"]
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        # Use a non-existent user ID
        non_existent_id = 9999
        
        update_data = {
            "first_name": "Non",
            "last_name": "Existent"
        }
        
        response = await client.patch(
            f"/account/{non_existent_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "User not found" in response.json()["detail"]
    
    async def test_update_email_conflict(self, client: AsyncClient, generate_testing_token, seed_dependencies, db_session):
        """Test updating email to one that already exists."""
        # Create a new user specifically for this test
        new_user = User(
            first_name="Email", 
            last_name="Conflict", 
            email="email.conflict@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        # Try to update to an email that already exists
        existing_user = seed_dependencies["user"]
        update_data = {
            "email": existing_user.email
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already taken" in response.json()["detail"]
    
    async def test_update_multiple_fields(self, client: AsyncClient, generate_testing_token, db_session):
        """Test updating multiple fields at once."""
        # Create a new user specifically for this test
        new_user = User(
            first_name="Multiple", 
            last_name="Fields", 
            email="multiple.fields@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        update_data = {
            "first_name": "Updated",
            "last_name": "Multiple",
            "email": "updated.multiple@example.com"
        }
        
        response = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(new_user)
        
        # Verify all fields were updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Multiple"
        assert updated_user.email == "updated.multiple@example.com"
    
    async def test_update_with_empty_payload(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test updating with an empty payload."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        # Empty update data
        update_data = {}
        
        response = await client.patch(
            f"/account/{user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should succeed but not change anything
        assert response.status_code == status.HTTP_200_OK
    
    async def test_update_with_invalid_email_format(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test updating with an invalid email format."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        update_data = {
            "email": "invalid-email"  # Invalid email format
        }
        
        response = await client.patch(
            f"/account/{user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should fail validation
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestDeleteUserAccount:
    async def test_delete_own_account_success(self, client: AsyncClient, generate_testing_token, db_session):
        """Test successfully deleting own user account."""
        # Create a new user specifically for deletion
        new_user = User(
            first_name="Delete", 
            last_name="Me", 
            email="delete.me@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        # Delete the account
        response = await client.delete(
            f"/account/{new_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the user was deleted from the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        deleted_user = result.scalars().first()
        assert deleted_user is None
    
    async def test_admin_delete_other_account(self, client: AsyncClient, generate_testing_token, db_session):
        """Test admin successfully deleting another user's account."""
        # Create a new user specifically for deletion
        new_user = User(
            first_name="Admin", 
            last_name="DeleteMe", 
            email="admin.delete.me@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Create a new admin user
        admin_user = User(
            first_name="Test", 
            last_name="Admin", 
            email="test.admin@example.com",
            hashed_password="secret", 
            role="admin", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(admin_user)
        await db_session.commit()
        await db_session.refresh(admin_user)
        
        # Use admin token
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        # Delete the account
        response = await client.delete(
            f"/account/{new_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the user was deleted from the database
        result = await db_session.execute(
            select(User).where(User.user_id == new_user.user_id)
        )
        deleted_user = result.scalars().first()
        assert deleted_user is None
    
    async def test_user_delete_other_account_forbidden(self, client: AsyncClient, generate_testing_token, seed_dependencies, db_session):
        """Test regular user cannot delete another user's account."""
        # Create a new user to be the target
        target_user = User(
            first_name="Target", 
            last_name="User", 
            email="target.user@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(target_user)
        await db_session.commit()
        await db_session.refresh(target_user)
        
        # Use a different user's token
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        response = await client.delete(
            f"/account/{target_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorised" in response.json()["detail"]
        
        # Verify the target user was NOT deleted
        result = await db_session.execute(
            select(User).where(User.user_id == target_user.user_id)
        )
        user_still_exists = result.scalars().first()
        assert user_still_exists is not None
    
    async def test_delete_nonexistent_account(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test deleting a non-existent user account."""
        admin_user = seed_dependencies["admin_user"]
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        # Use a non-existent user ID
        non_existent_id = 9999
        
        response = await client.delete(
            f"/account/{non_existent_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "User not found" in response.json()["detail"]
    
    async def test_delete_account_with_dependencies(self, client: AsyncClient, generate_testing_token, db_session):
        """Test deleting a user account that has dependencies (like recycling points)."""
        # This test would check if deleting a user properly cascades to related entities
        # Create a new council
        council = Council(
            gss_code="E12345678",
            name="Test Council",
            lon_lat_points={}
        )
        db_session.add(council)
        await db_session.flush()
        
        # Create a new council user with associated data
        council_user = User(
            first_name="Council", 
            last_name="Delete", 
            email="council.delete@example.com",
            hashed_password="secret", 
            role="council", 
            is_suspended=False, 
            mfa_key="123456",
            gss_code=council.gss_code
        )
        db_session.add(council_user)
        await db_session.flush()
        
        # Create an admin entry for this council user
        admin_entry = Admin(
            date=date.today(),
            council_user_id=council_user.user_id,
            gss_code=council.gss_code,
            is_approved=True
        )
        db_session.add(admin_entry)
        await db_session.commit()
        await db_session.refresh(council_user)
        
        # Generate token for this user
        token = generate_testing_token(council_user.email, council_user.role, {"user_id": council_user.user_id})
        
        # Delete the account
        response = await client.delete(
            f"/account/{council_user.user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the user was deleted from the database
        result = await db_session.execute(
            select(User).where(User.user_id == council_user.user_id)
        )
        deleted_user = result.scalars().first()
        assert deleted_user is None
        
        # Verify the admin entry was also deleted (cascade)
        result = await db_session.execute(
            select(Admin).where(Admin.council_user_id == council_user.user_id)
        )
        deleted_admin = result.scalars().first()
        assert deleted_admin is None


class TestCouncilUserSpecificCases:
    async def test_council_user_update_gss_code(self, client: AsyncClient, generate_testing_token, db_session):
        """Test council user updating their GSS code."""
        # Create a new council with a unique GSS code
        council = Council(
            gss_code="E12345001",
            name="Test Council",
            lon_lat_points={}
        )
        db_session.add(council)
        await db_session.flush()
        
        # Create another council for updating with a unique GSS code
        new_council = Council(
            gss_code="E12345002",
            name="New Council",
            lon_lat_points={}
        )
        db_session.add(new_council)
        await db_session.flush()
        
        # Create a new council user
        council_user = User(
            first_name="GSS", 
            last_name="Update", 
            email="gss.update@example.com",
            hashed_password="secret", 
            role="council", 
            is_suspended=False, 
            mfa_key="123456",
            gss_code=council.gss_code
        )
        db_session.add(council_user)
        await db_session.commit()
        await db_session.refresh(council_user)
        
        # Generate token for this user
        token = generate_testing_token(council_user.email, council_user.role, {"user_id": council_user.user_id})
        
        # Try to update GSS code
        update_data = {
            "gss_code": new_council.gss_code
        }
        
        response = await client.patch(
            f"/account/{council_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(council_user)
        
        # Verify the GSS code was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == council_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.gss_code == new_council.gss_code
    
    async def test_admin_update_council_user_role(self, client: AsyncClient, generate_testing_token, db_session):
        """Test admin updating a council user's role."""
        # Create a new council with a unique GSS code
        council = Council(
            gss_code="E12345003",
            name="Test Council",
            lon_lat_points={}
        )
        db_session.add(council)
        await db_session.flush()
        
        # Create a new council user
        council_user = User(
            first_name="Role", 
            last_name="Change", 
            email="role.change@example.com",
            hashed_password="secret", 
            role="council", 
            is_suspended=False, 
            mfa_key="123456",
            gss_code=council.gss_code
        )
        db_session.add(council_user)
        await db_session.flush()
        
        # Create a new admin user
        admin_user = User(
            first_name="Role", 
            last_name="Admin", 
            email="role.admin@example.com",
            hashed_password="secret", 
            role="admin", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(admin_user)
        await db_session.commit()
        await db_session.refresh(council_user)
        await db_session.refresh(admin_user)
        
        # Use admin token
        token = generate_testing_token(admin_user.email, admin_user.role, {"user_id": admin_user.user_id})
        
        # Try to update role
        update_data = {
            "role": "user"  # Change from council to user
        }
        
        response = await client.patch(
            f"/account/{council_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # This should succeed as admin can update roles
        assert response.status_code == status.HTTP_200_OK
        
        # Manually update the session to ensure we get fresh data
        await db_session.refresh(council_user)
        
        # Verify the role was updated in the database
        result = await db_session.execute(
            select(User).where(User.user_id == council_user.user_id)
        )
        updated_user = result.scalars().first()
        assert updated_user.role == "user"
    
    async def test_update_to_invalid_gss_code(self, client: AsyncClient, generate_testing_token, db_session):
        """Test updating to a different GSS code."""
        # Create two councils with unique GSS codes
        council1 = Council(
            gss_code="E12345004",
            name="Test Council",
            lon_lat_points={}
        )
        db_session.add(council1)

        # Create a second council for the update
        council2 = Council(
            gss_code="E99999999",
            name="New Council",
            lon_lat_points={}
        )
        db_session.add(council2)
    
        # Commit the councils first to ensure they exist in the database
        await db_session.commit()
    
        # Create a new council user
        council_user = User(
            first_name="Invalid",
            last_name="GSS",
            email="invalid.gss@example.com",
            hashed_password="secret",
            role="council",
            is_suspended=False,
            mfa_key="123456",
            gss_code=council1.gss_code
        )
        db_session.add(council_user)
        await db_session.commit()
        await db_session.refresh(council_user)

        # Generate token for this user
        token = generate_testing_token(council_user.email, council_user.role, {"user_id": council_user.user_id})

        # Try to update to the second council's GSS code
        update_data = {
        "gss_code": council2.gss_code
        }

        response = await client.patch(
            f"/account/{council_user.user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )

        # This should succeed
        assert response.status_code == status.HTTP_200_OK

        # Refresh the user to get updated data
        await db_session.refresh(council_user)
    
        # Verify the GSS code was updated in the database
        assert council_user.gss_code == council2.gss_code

class TestEdgeCases:
    async def test_update_with_malformed_json(self, client: AsyncClient, generate_testing_token, seed_dependencies):
        """Test updating with malformed JSON."""
        user = seed_dependencies["user"]
        token = generate_testing_token(user.email, user.role, {"user_id": user.user_id})
        
        # Send malformed JSON
        response = await client.patch(
            f"/account/{user.user_id}",
            content="{invalid json",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        # Should fail with 422 Unprocessable Entity
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_update_with_empty_string_values(self, client: AsyncClient, generate_testing_token, seed_dependencies, db_session):
        """Test that the API correctly rejects empty string values."""
        # Create a new user specifically for this test
        new_user = User(
            first_name="Empty", 
            last_name="String", 
            email="empty.string@example.com",
            hashed_password="secret", 
            role="user", 
            is_suspended=False, 
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
    
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
    
        # Save original values
        original_first_name = new_user.first_name
        original_last_name = new_user.last_name
    
        # Test empty first name
        update_data_first_name = {
            "first_name": ""
        }
    
        response_first_name = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data_first_name,
            headers={"Authorization": f"Bearer {token}"}
        )
    
        # API should reject empty first name
        assert response_first_name.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
        # Test empty last name
        update_data_last_name = {
            "last_name": ""
        }
    
        response_last_name = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data_last_name,
            headers={"Authorization": f"Bearer {token}"}
        )
    
        # API should reject empty last name
        assert response_last_name.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
        # Test both empty
        update_data_both = {
            "first_name": "",
            "last_name": ""
        }
    
        response_both = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data_both,
            headers={"Authorization": f"Bearer {token}"}
        )
    
        # API should reject when both are empty
        assert response_both.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
        # Verify the user data wasn't changed
        await db_session.refresh(new_user)
        assert new_user.first_name == original_first_name
        assert new_user.last_name == original_last_name
    
        # Test empty email
        update_data_email = {
            "email": ""
        }
    
        response_email = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data_email,
            headers={"Authorization": f"Bearer {token}"}
        )
    
        # API should reject empty email
        assert response_email.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_sequential_updates(self, client: AsyncClient, generate_testing_token, db_session):
        """Test sequential updates to the same user."""
        # Create a new user for this test
        new_user = User(
            first_name="Concurrent",
            last_name="Test",
            email="concurrent.test@example.com",
            hashed_password="secret",
            role="user",
            is_suspended=False,
            mfa_key="123456"
        )
        db_session.add(new_user)
        await db_session.commit()
        await db_session.refresh(new_user)
        
        # Generate token for this user
        token = generate_testing_token(new_user.email, new_user.role, {"user_id": new_user.user_id})
        
        # First update
        update_data1 = {
            "first_name": "First",
            "last_name": "Update"
        }
        
        response1 = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data1,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Verify the first update was successful
        assert response1.status_code == status.HTTP_200_OK
        
        # Second update
        update_data2 = {
            "first_name": "Second"
        }
        
        response2 = await client.patch(
            f"/account/{new_user.user_id}",
            json=update_data2,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Verify the second update was successful
        assert response2.status_code == status.HTTP_200_OK
        
        # Verify the final state in the database
        await db_session.refresh(new_user)
        assert new_user.first_name == "Second"
        assert new_user.last_name == "Update"
