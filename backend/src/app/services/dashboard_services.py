from app.database.models import RecyclingPoint, Product, Material, User
from app.schemas.dashboards import (
        DashboardResponse,
        # for user dashboard
        User as UserDashboard,
        Progress, EnvironmentalImpact, UserStatistics,
        # for council dashboard
        Council as CouncilDashboard, 
    )
from app.database.crud.recycling_points import get_points_by_council_code
from app.database.crud.councils import get_council_from_user_id
from app.database.crud.recycle_history import get_user_with_histories_eager
import datetime
from collections import defaultdict


async def get_user_dashboard(db, user_id: int) -> DashboardResponse:
    user = await get_user_with_histories_eager(db, user_id)
    user = user[0] if user else None  # Get the first user if multiple are returned
    if not user:
        raise KeyError("User not found")

    now = datetime.datetime.now().date()
    week_durations = [now - datetime.timedelta(days=7 * i) for i in range(5)]  # week_durations[0] = now, [1] = 7d ago, etc.

    weekly_totals = [0, 0, 0, 0]  # last_week, last_last, etc.
    daily_counts = defaultdict(int)  # For bar chart

    material_totals = defaultdict(int)

    for history in user.recycle_histories:
        history_date = history.date.date() if isinstance(history.date, datetime.datetime) else history.date
        for assoc in history.product_associations:
            qty = assoc.quantity
            # Track weekly bins (most recent week first)
            for i in range(4):
                if week_durations[i+1] < history_date <= week_durations[i]:
                    weekly_totals[i] += qty
                    break

            # Track day of week count (for progress chart)
            if history_date > week_durations[1]:
                weekday_name = history_date.strftime("%a").lower()
                daily_counts[weekday_name] += qty

            # Material total
            if assoc.product and assoc.product.material:
                material_name = assoc.product.material.name
                material_totals[material_name] += qty

    # Calculate improvements
    improvement = 0.0
    if weekly_totals[1] > 0:
        improvement = ((weekly_totals[0] - weekly_totals[1]) / weekly_totals[1]) * 100

    average_week = sum(weekly_totals) / 4

    # Placeholder environmental impact calc (can be replaced with real values)
    environmental_impact = EnvironmentalImpact(
        turtles_saved=weekly_totals[0] * 0.01,
        trees_saved=weekly_totals[0] * 0.02,
        co2_saved=weekly_totals[0] * 0.05
    )

    progress = Progress(
        items_per_day_over_last_week=daily_counts,
        improvement_over_last_week=improvement,
        average_items_per_week_over_last_month=average_week
    )

    statistics = UserStatistics(materials_recycled=material_totals)

    return UserDashboard(
        type="user",
        progress=progress,
        environmental_impact=environmental_impact,
        statistics=statistics
    )

async def get_council_dashboard(db, council_user_id: int) -> DashboardResponse:
    # get the council from the user id
    council = await get_council_from_user_id(db, council_user_id)
    if not council:
        raise KeyError("Council not found")
    # get list of recycling points for the council
    recycling_points = await get_points_by_council_code(db, council.gss_code)
    # for each recycling point, get the list of products recycled
    materials_per_point = {}
    for recycling_point in recycling_points:
        materials_per_point[recycling_point.point_id] = {}
        for recycle_history in recycling_point.recycle_histories:
            # for each product association in recycle history
            for association in recycle_history.product_associations:
                # get the product and material name
                product = association.product
                if product.material.name not in materials_per_point[recycling_point.point_id]:
                    materials_per_point[recycling_point.point_id][product.material.name] = 0
                # add the amount recycled to the material name
                materials_per_point[recycling_point.point_id][product.material.name] += association.quantity
    
    # return a DashboardResponse object with the council dashboard schema
    return CouncilDashboard(
        type="council",
        material_frequencies=materials_per_point
    )
