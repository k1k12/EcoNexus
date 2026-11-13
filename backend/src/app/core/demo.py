"""Public demo accounts, so people looking at the project can try every role.

The passwords are public on purpose: the website shows them in the demo popup.
They only exist when DEMO_ACCOUNTS=true, they're reset every time the server
starts, and the account routes refuse to change them or let them touch real
accounts.
"""
import os

DEMO_DOMAIN = "demo.econexus.org.uk"

# The frontend shows the same list in frontend/constants/DemoAccounts.ts
DEMO_ACCOUNTS = [
    {"email": f"user@{DEMO_DOMAIN}", "password": "DemoUser123!", "role": "user",
     "first_name": "Demo", "last_name": "User"},
    {"email": f"council@{DEMO_DOMAIN}", "password": "DemoCouncil123!", "role": "council",
     "first_name": "Demo", "last_name": "Council", "approved": True},
    {"email": f"admin@{DEMO_DOMAIN}", "password": "DemoAdmin123!", "role": "admin",
     "first_name": "Demo", "last_name": "Admin"},
    # Never logs in, it just gives the demo admin a council to approve
    {"email": f"pending-council@{DEMO_DOMAIN}", "password": None, "role": "council",
     "first_name": "Pending", "last_name": "Council", "approved": False},
]


def demo_accounts_enabled() -> bool:
    return os.getenv("DEMO_ACCOUNTS", "false").lower() == "true"


def is_demo_email(email: str) -> bool:
    return email.lower().endswith("@" + DEMO_DOMAIN)
