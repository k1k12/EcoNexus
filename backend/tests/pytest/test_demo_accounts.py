import pytest
from fastapi import status
from httpx import AsyncClient

from app.database.models import User

pytestmark = pytest.mark.asyncio


async def make_user(db_session, email, role="user"):
    user = User(
        first_name="Test",
        last_name="User",
        email=email,
        hashed_password="secret",
        role=role,
        is_suspended=False,
        mfa_key="",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


class TestDemoAccounts:
    async def test_demo_user_cannot_change_their_password(self, client: AsyncClient, generate_testing_token, db_session):
        """Test the public demo logins can't be taken over by changing the password."""
        demo = await make_user(db_session, "pw.test@demo.econexus.org.uk")
        token = generate_testing_token(demo.email, demo.role, {"user_id": demo.user_id})

        response = await client.patch(
            f"/account/{demo.user_id}",
            json={"password": "somethingnew123"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_demo_user_cannot_delete_themselves(self, client: AsyncClient, generate_testing_token, db_session):
        """Test a visitor can't delete a demo login for everyone else."""
        demo = await make_user(db_session, "delete.test@demo.econexus.org.uk")
        token = generate_testing_token(demo.email, demo.role, {"user_id": demo.user_id})

        response = await client.delete(
            f"/account/{demo.user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_demo_admin_cannot_see_real_accounts(self, client: AsyncClient, generate_testing_token, db_session):
        """Test the demo admin can't read real users' details."""
        demo_admin = await make_user(db_session, "admin.test@demo.econexus.org.uk", role="admin")
        real = await make_user(db_session, "real.person@example.com")
        token = generate_testing_token(demo_admin.email, demo_admin.role, {"user_id": demo_admin.user_id})

        response = await client.get(
            f"/account/{real.user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_demo_admin_cannot_change_real_accounts(self, client: AsyncClient, generate_testing_token, db_session):
        """Test the demo admin can't change or delete real users."""
        demo_admin = await make_user(db_session, "admin.change@demo.econexus.org.uk", role="admin")
        real = await make_user(db_session, "real.target@example.com")
        token = generate_testing_token(demo_admin.email, demo_admin.role, {"user_id": demo_admin.user_id})
        headers = {"Authorization": f"Bearer {token}"}

        patch = await client.patch(f"/account/{real.user_id}", json={"password": "hacked12345"}, headers=headers)
        delete = await client.delete(f"/account/{real.user_id}", headers=headers)

        assert patch.status_code == status.HTTP_403_FORBIDDEN
        assert delete.status_code == status.HTTP_403_FORBIDDEN

    async def test_cannot_register_with_demo_email(self, client: AsyncClient):
        """Test nobody can register an address on the reserved demo domain."""
        response = await client.post("/register", json={
            "email": "impostor@demo.econexus.org.uk",
            "password": "Testpass123!",
            "role": "user",
            "first_name": "Imp",
            "last_name": "Ostor",
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST
