from locust import HttpUser, task, between, SequentialTaskSet, events
import random
import time
import uuid

# Time structure for recycling point opening hours
times_open = {
    "monday": ["08:00", "17:00"],
    "tuesday": ["08:00", "17:00"],
    "wednesday": ["08:00", "17:00"],
    "thursday": ["08:00", "17:00"],
    "friday": ["08:00", "17:00"],
    "saturday": ["Closed", "Closed"],
    "sunday": ["Closed", "Closed"]
}

class BaseUser(HttpUser):
    abstract = True
    wait_time = between(0.5, 1.5)
    host = "http://127.0.0.1:8000"

    def login(self, email: str, password: str) -> bool:
        with self.client.post(
            "/login",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                token = data.get("access_token")
                user_id = data.get("user_id")
                if token and user_id:
                    self.client.headers.update({"Authorization": f"Bearer {token}"})
                    self.user_id = user_id
                    return True
            resp.failure(f"Login failed: {resp.status_code} {resp.text}")
            return False

class GuestBehavior(SequentialTaskSet):
    @task(3)
    def list_materials(self):
        self.client.get("/materials")

    @task(2)
    def bbox_lookup(self):
        self.client.get("/recycling-points", params={
            "min_lat": 53.7, "max_lat": 53.9, "min_lon": -1.6, "max_lon": -1.4
        })

    @task(1)
    def product_lookup(self):
        barcode = random.choice([
            "3029330003533", "5000159484695", "5449000000996"
        ])
        self.client.get(f"/product/{barcode}")

    @task(1)
    def unauthorized_create_point(self):
        payload = {
            "new": [{
                "user_id": 999,
                "gss_code": "TEST-GSS-001",
                "material_ids": [1, 2],
                "latitude": 53.8,
                "longitude": -1.54,
                "times_open": times_open,
            }],
            "updated": [],
            "deleted": []
        }
        with self.client.post("/recycling-points", json=payload, catch_response=True) as resp:
            if resp.status_code not in (401, 403):
                resp.failure(f"Guest should not POST: {resp.status_code}")
            else:
                resp.success()

    @task(1)
    def unauthorized_user_info(self):
        with self.client.get("/user-info", catch_response=True) as resp:
            if resp.status_code != 401:
                resp.failure(f"Expected 401, got {resp.status_code}")
            else:
                resp.success()

class GuestUser(BaseUser):
    tasks = [GuestBehavior]

class NormalBehavior(SequentialTaskSet):
    def on_start(self):
        if not self.user.login("danny@test.com", "test"):
            events.quitting.fire(reason="NormalUser login failed")

    @task(1)
    def try_create_point(self):
        payload = {
            "new": [{
                "user_id": self.user.user_id,
                "gss_code": "TEST-GSS-001",
                "material_ids": [1, 2],
                "latitude": 53.79,
                "longitude": -1.53,
                "times_open": times_open,
            }],
            "updated": [],
            "deleted": []
        }
        with self.client.post("/recycling-points", json=payload, catch_response=True) as resp:
            if resp.status_code not in (401, 403):
                resp.failure(f"Normal user wrongly created point: {resp.status_code}")
            else:
                resp.success()

    @task(2)
    def get_user_info(self):
        self.client.get("/user-info")

    @task(2)
    def get_account(self):
        self.client.get(f"/account/{self.user.user_id}")

    @task(1)
    def update_account(self):
        self.client.patch(f"/account/{self.user.user_id}", json={
            "first_name": "Updated", "last_name": "User"
        })

    @task(1)
    def delete_account(self):
        self.client.delete(f"/account/{self.user.user_id}")

class NormalUser(BaseUser):
    tasks = [NormalBehavior]

class CouncilBehavior(SequentialTaskSet):
    def on_start(self):
        if not self.user.login("sofia@test.com", "test"):
            events.quitting.fire(reason="CouncilUser login failed")

    @task(2)
    def get_by_gss(self):
        self.client.get("/recycling-points", params={"gss_code": "TEST-GSS-001"})

    @task(2)
    def get_by_materials(self):
        with self.client.get("/recycling-points", params=[
            ("material_ids", 1), ("material_ids", 2), ("max_results", 5)
        ], catch_response=True) as resp:
            if resp.status_code == 404:
                resp.failure("Material query returned 404: likely bad intersection logic or no match")
            else:
                resp.success()

    @task(1)
    def create_point(self):
        # Dynamically fetch material IDs
        with self.client.get("/materials", catch_response=True) as mat_resp:
            if mat_resp.status_code != 200:
                mat_resp.failure("Failed to fetch materials")
                return
            materials = mat_resp.json()
            if len(materials) < 2:
                mat_resp.failure("Not enough materials to test")
                return
            ids = [materials[0]["material_id"], materials[1]["material_id"]]

        payload = {
            "new": [{
                "user_id": self.user.user_id,
                "gss_code": "TEST-GSS-001",
                "material_ids": ids,
                "latitude": 53.81,
                "longitude": -1.541,
                "times_open": {
                    "monday": ["08:00", "17:00"],
                    "tuesday": ["08:00", "17:00"],
                    "wednesday": ["08:00", "17:00"],
                    "thursday": ["08:00", "17:00"],
                    "friday": ["08:00", "17:00"],
                    "saturday": ["Closed", "Closed"],
                    "sunday": ["Closed", "Closed"]
                },
            }],
            "updated": [],
            "deleted": []
        }

        with self.client.post("/recycling-points", json=payload, catch_response=True) as resp:
            if resp.status_code in (201, 207):
                resp.success()
            else:
                try:
                    detail = resp.json()
                except Exception:
                    detail = resp.text
                resp.failure(f"Council point create failed: {resp.status_code} – {detail}")

    @task(1)
    def try_delete_admin(self):
        with self.client.delete("/account/145", catch_response=True) as resp:
            if resp.status_code not in (403, 401, 404):
                resp.failure(f"Council wrongly deleted admin: {resp.status_code}")
            else:
                resp.success()

class CouncilUser(BaseUser):
    tasks = [CouncilBehavior]

class AdminBehavior(SequentialTaskSet):
    def on_start(self):
        if not self.user.login("admin@system.com", "test"):
            events.quitting.fire(reason="AdminUser login failed")

    @task(2)
    def list_councils(self):
        self.client.get("/all_councils")

    @task(1)
    def view_account(self):
        self.client.get(f"/account/{self.user.user_id}")

    @task(1)
    def delete_dummy_user(self):
        self.client.delete("/account/9999")

    @task(1)
    def invalid_update(self):
        payload = {
            "updated": [{
                "point_id": 1,
                "changed_fields": {"fake_field": "bad_value"}
            }],
            "new": [],
            "deleted": []
        }
        with self.client.post("/recycling-points", json=payload, catch_response=True) as resp:
            if resp.status_code not in (207, 422):
                resp.failure(f"Expected 207/422, got {resp.status_code}")
            else:
                resp.success()

class AdminUser(BaseUser):
    tasks = [AdminBehavior]

class RegistrationBehavior(SequentialTaskSet):
    @task
    def register_and_login(self):
        email = f"loadtest-{uuid.uuid4().hex[:10]}@example.com"
        self.client.post("/register", json={
            "first_name": "Load",
            "last_name": "Test",
            "email": email,
            "password": "test",
            "role": "user"
        })
        time.sleep(0.5)
        self.user.login(email, "test")

class RegistrationUser(BaseUser):
    tasks = [RegistrationBehavior]
