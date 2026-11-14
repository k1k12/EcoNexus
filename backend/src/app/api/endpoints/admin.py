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



# Headline numbers for the admin page
@router.get("/admin/overview")
async def admin_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authorized for this action.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    residents = await db.scalar(select(func.count()).select_from(User).filter(User.role == "user"))
    points = await db.scalar(select(func.count()).select_from(RecyclingPoint))

    # Approved councils and how many points each one has
    # (an area can have more than one approved council account, so check with exists rather than a join)
    has_approved_account = select(Admin.gss_code).filter(Admin.gss_code == Council.gss_code, Admin.is_approved == True).exists()
    approved = await db.execute(
        select(Council.gss_code, Council.name, func.count(RecyclingPoint.point_id))
        .outerjoin(RecyclingPoint, RecyclingPoint.gss_code == Council.gss_code)
        .filter(has_approved_account)
        .group_by(Council.gss_code, Council.name)
        .order_by(Council.name)
    )
    councils = [{"gss_code": gss, "name": name, "points": count} for gss, name, count in approved.all()]

    # Items recycled per day over the last 7 days, today last
    today = date.today()
    week_start = datetime.combine(today - timedelta(days=6), datetime.min.time())
    day = func.date(RecycleHistoryProductAssociation.date)
    per_day = await db.execute(
        select(day, func.sum(RecycleHistoryProductAssociation.quantity))
        .filter(RecycleHistoryProductAssociation.date >= week_start)
        .group_by(day)
    )
    totals = {d: int(n) for d, n in per_day.all()}
    last_week = [
        {"date": (today - timedelta(days=6 - i)).isoformat(), "items": totals.get(today - timedelta(days=6 - i), 0)}
        for i in range(7)
    ]
    all_time = await db.scalar(select(func.coalesce(func.sum(RecycleHistoryProductAssociation.quantity), 0)))

    return {
        "residents": residents,
        "recycling_points": points,
        "councils": councils,
        "items_last_week": last_week,
        "items_all_time": int(all_time),
    }
