########## Imports ##########

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_db, get_current_user
from app.schemas.dashboards import DashboardResponse
from app.services.dashboard_services import get_user_dashboard, get_council_dashboard

router = APIRouter()

########### Route ##########
@router.get("/dashboard", response_model=DashboardResponse, tags=["User Dashboard"])
async def get_user_dashboard_route(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get the user dashboard data for the current user.
    
    This endpoint returns the dashboard data based on the user's role.
    - If the user is a regular user, it fetches data in user dashboard format:
        example: {
            "type": "user",
            "progress": {
                "items_per_day_over_last_week": {
                    "mon": 5,
                    "tue": 3,
                    "wed": 4,
                    "thu": 6,
                    "fri": 2,
                    "sat": 7,
                    "sun": 1
                },
                "improvement_over_last_week": 0.2,
                "average_items_per_week_over_last_month": 25.0
            },
            "environmental_impact": {
                "turtles_saved": 0.5,
                "trees_saved": 1.0,
                "co2_saved": 10.0
            },
            "statistics": {
                "materials_recycled": {
                    "plastic_bottle": 10,
                    "glass_bottle": 5
    - If the user is a council member, it fetches the council dashboard.
    
        example: {
            "type": "council",
            "material_frequencies": {
                1: {
                    "plastic_bottle": 10,
                    "glass_bottle": 5
                },
                2: {
                    "plastic_bottle": 8,
                    "glass_bottle": 3
    """
    try:
        if current_user.role == "user":
            return await get_user_dashboard(db, current_user.user_id)
        elif current_user.role == "council":    
            return await get_council_dashboard(db, current_user.user_id)
        else:
            raise HTTPException(status_code=403, detail="Not authorized to this endpoint (user role not recognised)")
    except KeyError:
        raise HTTPException(status_code=404, detail="Council not found"
)
