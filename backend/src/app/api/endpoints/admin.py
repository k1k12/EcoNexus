from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.models import Admin, User
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
        select(Admin)
        .filter(Admin.is_approved == False)  # Only pending approvals
    )

    pending_councils = result.scalars().all()

    if not pending_councils:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending councils found",
        )
    
    # Prepare response
    councils_data = []
    for admin in pending_councils:
        councils_data.append({
            "gss_code": admin.gss_code,
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

    result = await db.execute(select(Admin).filter(Admin.gss_code == gss_code))
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

