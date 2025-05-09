########## Imports ##########

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional, List, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.dependencies import get_db, get_current_user
from app.services.recycling_points_services import (
    get_area_points_service,
    get_council_points_service,
    get_point_by_id,
    get_user_is_approved,
    get_points_within_radius,
    get_optimal_points_for_materials,
    init_post_response,
    build_points_response,
    handle_bulk_create,
    handle_bulk_update,
    handle_bulk_delete,
    _point_to_dict
)
from app.schemas.recycling_points import (
    RecyclingPointRequest,
    RecyclingPointResponse,
    RecyclingPointBulkResponse
)
from app.database.models import User, Material

########## Endpoints ##########

router = APIRouter()

@router.post(
    "/recycling-points",
    status_code=status.HTTP_200_OK,
    response_model=RecyclingPointBulkResponse,
)
async def post_points(
    payload: RecyclingPointRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    TLDR
    ----
    Create, update or delete recycling points in a single bulk request.
    
    Description
    -----------
    This endpoint recieves a POST request to perform one or more of the following:
    - Create new recycling points (`new`)
    - Update existing recycling points (`updated`)
    - Delete recycling points by ID (`deleted`)

    Each operation will be attempted independently. The response includes a summary with
    appropriate status codes (e.g. 200) and error messages in case of failure.

    Accepts a JSON payload containing:
        - new: List of new recycling points to be added
        - updated: A list of dictionaries with `point_id` and `changed_fields` for a recycling point to update
        - deleted: List of recycling point IDs to delete

    Returns:
        dict: A structured response with the outcome of each operation

    Raises:
        ValueError: If a point doesn't exist or has invalid data during add/update
        PermissionError: If the user is not authorised to delete a point
        KeyError: If the point ID is not found in the database during an update
        TypeError: If the point ID is not passed to services as a pydantic model

    """
    response = await init_post_response()

    if not (payload.new or payload.updated or payload.deleted):
        return JSONResponse(
            status_code=status.HTTP_207_MULTI_STATUS,
            content=jsonable_encoder({
                "new": [],
                "updated": [],
                "deleted": [],
                "errors": [
                    {"ALL": await build_points_response(
                        400, result_p=None,
                        error_p="Empty payload: no operations provided"
                    )}
                ]
            })
        )

    if payload.new and not payload.updated and not payload.deleted:
        if user.role not in ["council", "admin"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=jsonable_encoder({
                    **response,
                    "errors": [
                        {"ALL": await build_points_response(
                            403, None,
                            "User is not allowed to create points"
                        )}
                    ]
                })
            )
        if user.role == "council" and not await get_user_is_approved(db, user):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=jsonable_encoder({
                    **response,
                    "errors": [
                        {"ALL": await build_points_response(
                            403, None,
                            "User is not approved and thus cannot create points"
                        )}
                    ]
                })
            )

        material_ids = {m for item in payload.new for m in item.material_ids}
        if material_ids:
            result = await db.execute(
                select(Material.material_id)
                .where(Material.material_id.in_(material_ids))
            )
            existing = {r[0] for r in result.fetchall()}
            invalid = material_ids - existing
            if invalid:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content=jsonable_encoder({
                        **response,
                        "errors": [
                            {"ALL": await build_points_response(
                                400, None,
                                f"Invalid material_ids: {invalid}"
                            )}
                        ]
                    })
                )
        await handle_bulk_create(db, user, payload.new, response)
        if response["errors"]:
            code = status.HTTP_207_MULTI_STATUS
        else:
            code = status.HTTP_201_CREATED
        return JSONResponse(status_code=code, content=jsonable_encoder(response))

    if user.role not in ["council","admin"]:
        return JSONResponse(
            status_code=status.HTTP_207_MULTI_STATUS,
            content=jsonable_encoder({
                **response,
                "errors": [
                    {"ALL": await build_points_response(
                        403, None,
                        "User is not allowed to modify points"
                    )}
                ]
            })
        )

    if user.role == "council" and not await get_user_is_approved(db, user):
        return JSONResponse(
            status_code=status.HTTP_207_MULTI_STATUS,
            content=jsonable_encoder({
                **response,
                "errors": [
                    {"ALL": await build_points_response(
                        403, None,
                        "User is not approved and thus cannot modify points"
                    )}
                ]
            })
        )

    if payload.new:
        await handle_bulk_create(db, user, payload.new, response)
    if payload.updated:
        await handle_bulk_update(db, user, payload.updated, response)
    if payload.deleted:
        await handle_bulk_delete(db, user, payload.deleted, response)

    return JSONResponse(
        content=jsonable_encoder(response),
        status_code=status.HTTP_207_MULTI_STATUS
    )

@router.get(
    "/recycling-points",
    response_model=Union[
        RecyclingPointResponse,
        List[RecyclingPointResponse]
    ],
    tags=["recycling-points"]
)
async def get_points(
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    point_id: Optional[int] = None,
    gss_code: Optional[str] = None,
    near_lat: Optional[float] = Query(
        None, ge=-90, le=90,
        description="Latitude for radius search"
    ),
    near_lon: Optional[float] = Query(
        None, ge=-180, le=180,
        description="Longitude for radius search"
    ),
    radius_km: float = Query(
        5.0, gt=0,
        description="Radius (km) for nearby search"
    ),
    material_ids: Optional[List[int]] = Query(
        None,
        description="List of material IDs for optimal search"
    ),
    max_results: int = Query(
        5, gt=0, le=20,
        description="Max results for optimal search"
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    TLDR
    ----
    Retrieve recycling point(s) based on which query paramaters provided.

    DESCRIPTION
    -----------

    Depending on which query parameters you supply, will do exactly one of:
    - `material_ids=[…]` (optionally `max_results`)
        * return up to `max_results` points accepting *all* those materials, raises 404 if none
    - `near_lat` & `near_lon` (optionally `radius_km`)
        * return points within radius (possibly empty)
    - `point_id=…`
        * return that single point, raises 404 if not found
    - `gss_code=…`
        * return all points for that council
    - full bbox via `min_lat,max_lat,min_lon,max_lon`
        * return all points inside

    Raises:
        HTTPException (400): If no valid parameters or invalid combination are provided
        HTTPException (404): If point/material search finds nothing

    Returns:
        RecyclingPointResponse | List[RecyclingPointResponse]: Recycling point data list
    """

    if material_ids is not None:
        pts = await get_optimal_points_for_materials(
            db, material_ids, near_lat, near_lon, max_results
        )
        if near_lat is not None and near_lon is not None:
            pts = [p for p in pts if getattr(p, "_distance_km", float("inf")) <= radius_km]
        if not pts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No points found for given materials within radius"
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder([_point_to_dict(p) for p in pts])
        )


    if near_lat is not None and near_lon is not None:
        pts = await get_points_within_radius(db, near_lat, near_lon, radius_km)
        pts = pts[:max_results]
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder([_point_to_dict(p) for p in pts])
        )

    has_point = point_id is not None
    has_council = gss_code is not None
    has_bbox = None not in (min_lat, max_lat, min_lon, max_lon)

    if (has_point + has_council + has_bbox) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please supply exactly one of: material_ids, near_lat/near_lon, point_id, gss_code, or bbox."
        )

    if has_point:
        point = await get_point_by_id(db, point_id)
        if not point:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Point not found"
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(_point_to_dict(point))
        )

    if has_council:
        points = await get_council_points_service(db, gss_code)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder([_point_to_dict(p) for p in points])
        )

    if min_lat > max_lat or min_lon > max_lon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid bounding box coordinates"
        )
    points = await get_area_points_service(
        db, min_lat, min_lon, max_lat, max_lon
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=jsonable_encoder([_point_to_dict(p) for p in points])
    )
