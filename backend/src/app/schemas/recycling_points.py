########## Imports ##########
from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator, Extra
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, time
import math

########## Requests ##########
class RecyclingPointRequest(BaseModel):
    """
    Used in POST requests to the `/recycling-points` endpoint.

    Combined request body:
        - Add new points
        - Update a point
        - Delete points

    Attributes:
        new (RecyclingPointCreateRequest): A single new point to be added
        updated (List[RecyclingPointUpdateRequest]): Updated point ID and changed fields
        deleted (List[int]): A list of point ID's to be deleted
    """
    new: Optional[List[RecyclingPointCreateRequest]]
    updated: Optional[List[RecyclingPointUpdateRequest]]
    deleted: Optional[List[int]]
class RecyclingPointCreateRequest(BaseModel):
    """
    Schema for defining a recycling point to be added.
   
     Used inside the `new` field of a POST request.

    Attributes:
        gss_code (int): GSS code identifying the council area
        latitude (float): Latitude of the recycling point
        longitude (float): Longitude of the recycling point
        user_id (int): ID of the user creating the point
        material_id (int): ID of the material accepted at the recycling point
        times_open (Dict[str, Tuple[str, str]]): Opening hours as a list of dictionaries with days as keys and times as values
    """
    point_id: int = Field(-1, description="Temp ID from frontend, -1 means 'new'")
    gss_code: Optional[str] = None
    user_id: int
    material_ids: List[int]
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    times_open: WeeklyHours

    @field_validator("latitude", "longitude")
    def no_nan_inf(cls, v):
        if not isinstance(v, (int, float)) or math.isnan(v) or math.isinf(v):
            raise ValueError("Invalid coordinate value.")
        return v

class RecyclingPointUpdateRequest(BaseModel):
    """
    Schema for updating an existing recycling point.
    
    Attributes:
        point_id (int): ID of the recycling point to update
        changed_fields (RecyclingPointUpdateFields)
    """
    point_id: int
    changed_fields: RecyclingPointUpdateFields
class RecyclingPointUpdateFields(BaseModel):
    """
    Schema for updating an existing recycling point.
    
    Attributes:
        gss_code (int): GSS code identifying the council area
        latitude (float): Latitude of the recycling point
        longitude (float): Longitude of the recycling point
        user_id (int): ID of the user creating the point
        material_id (int): ID of the material accepted at the recycling point
        times_open Dict[str, Tuple[str, str]]: Opening hours as a list of (day: [start_time, end_time]) pairs in "HH:MM" format
    """
    user_id: Optional[int] = None
    gss_code: Optional[str] = None
    material_ids: Optional[List[int]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    times_open: Optional[WeeklyHours] = None

    model_config = ConfigDict(from_attributes=True, extra=Extra.forbid)

    @field_validator("times_open", mode="before")
    def validate_times_open(cls, v):
        if v is None:
            return None
        
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        normalised: dict[str, tuple[str,str]] = {}

        for day, times in v.items():
            # allow list or tuple
            if not isinstance(times, (list, tuple)) or len(times) != 2:
                raise ValueError(f"Times for {day} must be a 2‑element list or tuple")
            start, end = times
            normalised[day.lower()] = (start, end)

        missing = set(weekdays) - normalised.keys()
        if missing:
            raise ValueError(f"Missing time slots for {missing}")

        for day, (start, end) in normalised.items():
            if start != "Closed" or end != "Closed":
                cls.validate_time_format(start, day, "start")
                cls.validate_time_format(end, day, "end")

        return normalised

    @staticmethod
    def validate_time_format(time_str: str, day: str, time_type: str):
        try:
            datetime.strptime(time_str, "%H:%M")
        except ValueError:
            raise ValueError(f"Invalid time format for {day} {time_type}: '{time_str}'. Use 'HH:MM' format.")

######### Responses #########
class RecyclingPointResponse(BaseModel):
    """
    Response model for the result of a POST request on a recycling point.

    Attributes:
        status (Optional[int]): HTTP status code
        result (Optional[Any]): Additional success data, if applicable
        error (Optional[str]): Error message if request failed

    """    
    status: Optional[int] = None
    result: Optional[RecyclingPointUpdateFields] = None
    error: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            time: lambda v: v.strftime("%H:%M")
            }
        )
class RecyclingPointBulkResponse(BaseModel):
    """
    Used as the response type for the `/recycling-points` POST endpoint.

    Response model for bulk requests on a recycling point.

    Attributes:
        new (Optional[RecyclingPointResponse]): List of results for new points added with point_id, status, response
        updated (Optional[RecyclingPointResponse]): List of results for points updated with point_id, status, response
        deleted (Optional[List[RecyclingPointResponse]]): List of results for points deleted with point_id, status, response.
        errors (Optional[List[RecyclingPointResponse]]): Contains errors when request fails.
    """
    new: Optional[List[Dict[str, RecyclingPointResponse]]] = []
    updated: Optional[List[Dict[str, RecyclingPointResponse]]] = []
    deleted: Optional[List[Dict[str, RecyclingPointResponse]]] = []
    errors: Optional[List[Dict[str, RecyclingPointResponse]]] = []

    model_config = ConfigDict(from_attributes=True)

########## Opening Hours #########
class WeeklyHours(BaseModel):
    monday:    Tuple[str, str]
    tuesday:   Tuple[str, str]
    wednesday: Tuple[str, str]
    thursday:  Tuple[str, str]
    friday:    Tuple[str, str]
    saturday:  Tuple[str, str]
    sunday:    Tuple[str, str]

    @field_validator("*", mode="before")
    def _normalize_day(cls, v, info: ValidationInfo):
        day = info.field_name  # e.g. "monday", "tuesday", …
        # allow literal "Closed" or ("Closed","Closed")
        if v == "Closed" or v == ("Closed","Closed") or v == ["Closed", "Closed"]:
            return ("Closed","Closed")
        # must be a 2‑tuple or list of strings
        if isinstance(v, (list, tuple)) and len(v) == 2 and all(isinstance(x, str) for x in v):
            start, end = v
            for t,label in ((start,"start"),(end,"end")):
                try:
                    datetime.strptime(t, "%H:%M")
                except ValueError:
                    raise ValueError(f"{day} {label} must be HH:MM")
            return (start, end)
        raise ValueError(f"{day} must be two HH:MM strings or 'Closed'")
    
    
