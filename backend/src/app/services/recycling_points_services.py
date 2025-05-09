######### Imports #########

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import RecyclingPoint, User
from app.services.materials_service import get_materials_list
from app.database.crud.recycling_points import (
    add_point,
    update_point,
    delete_point,
    get_points,
    get_point_by_id,
    get_council_by_gss,
    get_points_by_council_code,
    get_points_by_materials,
    get_points_by_area,
    check_point_at_location
    )
from app.database.crud.auth import get_user_is_approved_db
from app.schemas.recycling_points import RecyclingPointCreateRequest, RecyclingPointUpdateFields, RecyclingPointResponse, WeeklyHours
from app.core.security import check_point_association
from typing import Dict, List
import math

PERMISSION_ERROR = "User role is not approved."
######### Services #########

async def add_point_service(db: AsyncSession, user: User, point: RecyclingPointCreateRequest):
    """
    A service function to add a recycling point.
    This service allows users with the "council" or "admin" role to create a new recycling point. 

    Args:
        db (AsyncSession): Database session
        user (User): The user making the request
        point (RecyclingPointCreateRequest): Data for the new recycling point

    Returns:
        RecyclingPoint: The created recycling point

    Raises:
        ValueError: The point is not found
        PermissionError: The user has not got correct priviledges
    """

    # check user role
    if user.role not in ["council", "admin"] or user.user_id != point.user_id:
        raise PermissionError("User not allowed to add a point.")

    if user.role == "council" and (user.gss_code != point.gss_code):
        raise PermissionError("User cannot add points outside their council's area.")
    
    if await check_point_at_location(db,point.latitude,point.longitude):
        raise ValueError("A recycling point already exists at this location.")
    
    new_point = await create_recycling_point(db, point)
    return await add_point(db, new_point)

async def update_point_service(db: AsyncSession, user: User, point_id: int, changed_fields: dict):
    """
    A service function to update a recycling point.
    This service checks the user's permissions and then applies only the allowed field changes
    to the recycling point.

    Args:
        db (AsyncSession): Database session
        user (User): The user making the request
        point_id (int): The ID of the recycling point to update
        changed_fields (dict): A dictionary of fields to update and their new values

    Returns:
        RecyclingPoint: The updated recycling point

    Raises:
        ValueError: The point is not found
        PermissionError: The user has not got correct priviledges
    """

    recycling_point = await get_point_by_id(db, point_id)

    if user.role == "council" and "gss_code" in changed_fields and changed_fields["gss_code"] != user.gss_code:
        raise PermissionError("Cannot change gss_code")

    if user.role == "council" and recycling_point.gss_code != user.gss_code:
            raise PermissionError(PERMISSION_ERROR)

    valid_fields = set(RecyclingPointUpdateFields.model_fields.keys())
    invalid_fields = [field for field in changed_fields if field not in valid_fields]

    if invalid_fields:
        raise ValueError(f"Invalid fields provided: {', '.join(invalid_fields)}")

    updates = {field: value for field, value in changed_fields.items() if field in valid_fields}

    updated = False
    for key, value in changed_fields.items():
        if key in valid_fields and (value is not None or key in recycling_point.__dict__):
            setattr(recycling_point, key, value)
            updated = True

    if updated:
        return await update_point(db, point_id, updates)
    else:
        raise ValueError("No fields were updated.")

async def delete_point_service(db: AsyncSession, user: User, point_id: int):
    """
    A service function to delete a recycling point.
    This service allows users with correct priviledges to delete an existing recycling point.
    Permissions are determined by the user's role and association with the point.

    Args:
        db (AsyncSession): Database session
        user (User): The user making the request
        point_id (int): The ID of the recycling point to delete

    Returns:
        RecyclingPoint: The deleted recycling point

    Raises:
        ValueError: The point is not found
        PermissionError: The user has not got correct priviledges
    """

    recycling_point = await get_point_by_id(db, point_id)

    if not recycling_point:
        raise KeyError("Recycling point not found")

    if user.role == "admin":
        return await delete_point(db, point_id)
    elif user.role == "council":
        if not (await check_point_association(user, recycling_point) or recycling_point.user_id != user.user_id):
            raise PermissionError(PERMISSION_ERROR)
        return await delete_point(db, point_id)
    else:
        raise PermissionError(PERMISSION_ERROR)

async def check_valid_fields(changed_fields: dict):
    
    valid_fields = set(RecyclingPointUpdateFields.model_fields.keys())
    invalid_fields = [field for field in changed_fields if field not in valid_fields]

    if invalid_fields:
        print("INVALID FIELDS DETECTED:", invalid_fields)
        return False
    elif all(value is None for value in changed_fields.values()):
        print("No fields")
        return False
    return True

async def set_required_fields(changed_fields: dict, point: RecyclingPoint):
    required_fields = ["gss_code", "longitude", "latitude", "user_id"]
    for field in required_fields:
        if field not in changed_fields or changed_fields[field] is None:
            changed_fields[field] = getattr(point, field)
    
async def get_area_points_service(db: AsyncSession, min_lat: float, min_lon: float, max_lat: float, max_lon: float):
    """
    A service function to retrieve all recycling points located between the given latitude and longitude
    boundaries.

    Args:
        db (AsyncSession): Database session
        min_lat (float): Minimum latitude of given area
        min_lon (float): Minimum longitude of given area
        max_lat (float): Maximum latitude of given area
        max_lon (float): Maximum longitude of given area

    Raises:
        TBR: I'm sure itll raise something let me test it and TBR

    """
    # TBR: shall i add rate limiting..? or set max box size what if they request areas bigger then the UK?
    return await get_points_by_area(db, min_lat, min_lon, max_lat, max_lon)

async def get_council_points_service(db: AsyncSession, gss_code: int):
    """
    A service function that retrieves all a councils recycling points.

    Args:
        db (AsyncSession): Database session
        council_id (int): The ID of the council whose points are being retrieved

    Returns:
        List[RecyclingPoint]: A list of recycling points owned by the council

    Raises:
    ValueError: if the point is not found
    """

    council = await get_council_by_gss(db, gss_code)
    if not council:
        return []

    return await get_points_by_council_code(db, council.gss_code)

async def get_user_is_approved(db: AsyncSession, user: User):
    return await get_user_is_approved_db(db, user)

async def get_points_within_radius(
    db: AsyncSession, lat: float, lon: float, radius_km: float
) -> List[RecyclingPoint]:
    """
    Haversine search: fetch all points, filter by distance.
    """
    all_points = await get_points(db)

    result = []
    for p in all_points:
        d = await _haversine(lat, lon, p.latitude, p.longitude)
        if d <= radius_km:
            setattr(p, "_distance_km", d)
            result.append(p)
    
    return sorted(result, key=lambda p: getattr(p, "_distance_km", 0))

async def get_optimal_points_for_materials(
    db: AsyncSession,
    material_ids: List[int],
    lat: float,
    lon: float,
    max_results: int
) -> List[RecyclingPoint]:
    """
    Finds points that accept all the requested materials.
    Distances are computed and points are ordered by proximity.
    Otherwise returns arbitrary up to `max_results`.
    """
    pts = await get_points_by_materials(db, material_ids)

    if lat is not None and lon is not None:
        for p in pts:
            setattr(p, "_distance_km", await _haversine(lat, lon, p.latitude, p.longitude))
        pts.sort(key=lambda p: getattr(p, "_distance_km"))
    return pts[:max_results]

########## Response helpers ##########

async def format_time_slots(time_slots):
    """
    Converts a list of time slot tuples into string format.

    Args:
        time_slots (List[List[time]]): A list of [start_time, end_time] objects.

    Returns:
        List[List[str]]: A list of [start_time_str, end_time_str] in "HH:MM" format.
    
    Example:
        Input: [[time(9, 0), time(17, 0)]]
        Output: [["09:00", "17:00"]]
    """
    return [[t1.strftime('%H:%M'), t2.strftime('%H:%M')] for t1, t2 in time_slots]

async def init_post_response():
    """
    Sets a standardised response structure for recycling point POST requests.

    Returns:
        dict: A dictionary containing empty lists for new, updated, and deleted items.
    
    Example:
        Output: { new: [], updated: [], deleted: [], "errors": {} }
    """
    return {
        "new": [],
        "updated": [],
        "deleted": [],
        "errors": []
    }

async def set_recycling_point(
        user_id: int,
        gss_code: str,
        material_ids: list[int],
        latitude: float,
        longitude: float,
        times_open: dict | WeeklyHours
        ) -> RecyclingPoint:
    
    if not isinstance(times_open, WeeklyHours):
        times_open = WeeklyHours(**times_open)

    return RecyclingPointCreateRequest(
        user_id=user_id,
        gss_code=gss_code,
        material_ids=material_ids,
        latitude=latitude,
        longitude=longitude,
        times_open=times_open
    )

async def create_recycling_point(db: AsyncSession, point: RecyclingPointCreateRequest):
    
    materials = await get_materials_list(db, point.material_ids)
    weekly_hours = point.times_open

    for day, (start, end) in weekly_hours.model_dump().items():
        if start != "Closed" and end != "Closed":
            try:
                start_time = datetime.strptime(start, "%H:%M")
                end_time = datetime.strptime(end, "%H:%M")
                if start_time >= end_time:
                    raise ValueError(f"Opening time must be before closing time on {day}: {start}–{end}")
            except ValueError:
                raise ValueError(f"Invalid time format for {day}: '{start}'–'{end}'. Expected HH:MM")

    return RecyclingPoint(
        user_id=point.user_id,
        gss_code=point.gss_code,
        materials=materials,
        latitude=point.latitude,
        longitude=point.longitude,
        times_open=point.times_open.model_dump()
    )

async def build_points_response(status_p: int, result_p: RecyclingPoint, error_p: str = None) -> RecyclingPointResponse:
    """
    Builds a structured response for a single recycling point operation.

    Args:
        status_p (int): HTTP status code (e.g. 200 for success, 400/403/404 for errors)
        result_p (Optional[Any]): Success result data to include
        error_p (Optional[str]): Error message if the operation failed

    Returns:
        RecyclingPointBulkResponse: A structured response object representing the outcome
    
    Example:
        build_points_response(200, result={"message": "Created successfully"}, error={point_id: "Error error"})
    """

    return {"status": status_p, "result": result_p, "error": error_p}

async def handle_bulk_create(db: AsyncSession, user: User, payload_new: list, response: dict):
    
    for point in payload_new:
        point_id = getattr(point, "point_id", -1)
        try:
            new_point = await set_recycling_point(point.user_id, point.gss_code, point.material_ids, point.latitude, point.longitude, point.times_open)
            result = await add_point_service(db, user, new_point)
            point_id = result.point_id
            response["new"].append({str(point_id): await build_points_response(201, result)})
        except ValueError as e:
            print("Error adding point:", e)
            response["errors"].append({str(point_id): await build_points_response(400, result_p=None, error_p=str(e))})        
        except PermissionError as e:
            print("Permission denied for adding popint", e)
            response["errors"].append({str(point_id): await build_points_response(403, result_p=None, error_p=str(e))})
        except Exception as e:
            print(f"Unexpected error during creation: {e}")
            response["errors"].append({str(point_id): await build_points_response(400, result_p=None, error_p=str(e))})

async def handle_bulk_update(db: AsyncSession, user: User, payload_update: list, response: dict):
    """
    Applies updates to multiple recycling points.

    Args:
        db (AsyncSession): Database session
        user (User): The authenticated user
        payload_update (List[RecyclingPointUpdateRequest]): List of point_id + changed_fields
        response (dict): The main bulk response structure
    """
    for point in payload_update:
        point_id = point.point_id
        changed_fields = point.changed_fields.model_dump(exclude_unset=True)

        try:
            existing_point = await get_point_by_id(db, point_id)
            if not existing_point:
                raise KeyError("Recycling point not found")

            if not await check_valid_fields(changed_fields):
                response["errors"].append({str(point_id): await build_points_response(400, None, "Invalid fields provided for update")})
                continue
        
            await set_required_fields(changed_fields, existing_point)

            updated_point = await update_point_service(db, user, point_id, changed_fields)
            response["updated"].append({str(point_id): await build_points_response(200, updated_point)})

        except PermissionError as e:
            response["errors"].append({str(point_id): await build_points_response(403, None, str(e))})
        except TypeError as e:
            response["errors"].append({str(point_id): await build_points_response(400, None, str(e))})
        except KeyError as e:
            response["errors"].append({str(point_id): await build_points_response(404, None, str(e))})
        except ValueError as e:
            response["errors"].append({str(point_id): await build_points_response(400, None, str(e))})

async def handle_bulk_delete(db: AsyncSession, user: User, payload_delete: list, response: dict):
    """
    Deletes multiple recycling points by ID.

    Args:
        db (AsyncSession): Database session
        user (User): The authenticated user
        payload_delete (List[int]): List of point IDs to delete
    """

    existing = set()
    for pid in payload_delete:
        if await get_point_by_id(db, pid):
            existing.add(pid)

    seen = set()
    for pid in payload_delete:
        if pid in existing and pid not in seen:
            deleted = await delete_point_service(db, user, pid)
            response["deleted"].append(
                {str(pid): await build_points_response(200, deleted)}
            )
            seen.add(pid)

        elif pid in seen:
            response["deleted"].append(
                {str(pid): await build_points_response(200, None)}
            )

        else:
            response["errors"].append(
                {str(pid): await build_points_response(404, None, "Recycling point not found")}
            )

def _point_to_dict(p: RecyclingPoint) -> Dict:
    return {
        "point_id": p.point_id,
        "user_id": p.user_id,
        "gss_code": p.gss_code,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "materials": [m.synonyms[0] for m in p.materials if m.synonyms],
        "times_open": p.times_open,
    }

async def _haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    a, b = math.radians(lat1), math.radians(lat2)
    c = math.radians(lat2 - lat1)
    d = math.radians(lon2 - lon1)
    r = math.sin(c/2)**2 + math.cos(a)*math.cos(b)*math.sin(d/2)**2
    return R * 2 * math.atan2(math.sqrt(r), math.sqrt(1 - r))
