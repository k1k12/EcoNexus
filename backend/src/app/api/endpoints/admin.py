from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timedelta
from sqlalchemy import func
from sqlalchemy.future import select
from app.database.models import Admin, Council, RecycleHistoryProductAssociation, RecyclingPoint, User
from app.api.dependencies import get_db, get_current_user


router = APIRouter(tags=["admin"])

# Get pending councils
@router.get("/pending-councils")
async def get_pending_councils(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user), 
):
    if current_user.role != "admin":
        raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authorized for this action.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    result = await db.execute(
        select(Admin, User, Council)
        .join(User, User.user_id == Admin.council_user_id)
        .join(Council, Council.gss_code == Admin.gss_code)
        .filter(Admin.is_approved == False)  # Only pending approvals
        .order_by(Admin.date)
    )

    # Prepare response
    councils_data = []
    for admin, user, council in result.all():
        councils_data.append({
            "gss_code": admin.gss_code,
            "council_name": council.name,
            "requested_by": f"{user.first_name} {user.last_name}",
            "requested_on": admin.date.isoformat(),
        })

    return {"pending_councils": councils_data}

# approve council
@router.patch("/council-approval/{gss_code}")
async def council_approval(
    gss_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user), 
):

    if current_user.role != "admin":
        raise   HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authorized for this action.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    result = await db.execute(
        select(Admin).filter(Admin.gss_code == gss_code, Admin.is_approved == False)
    )
    pending_approval = result.scalars().first()

    if not pending_approval:
        raise   HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authorized for this action.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    pending_approval.is_approved = True
    db.add(pending_approval)
    await db.commit()

    return {"message": "Council approved successfully"}

