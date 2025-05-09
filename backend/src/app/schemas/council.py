from pydantic import BaseModel
from typing import Any

class CouncilRead(BaseModel):
    """
    Schema for reading council data.
    example: {
        "gss_code": "E09000001",
        "name": "Westminster",
        "lon_lat_points": [
            (51.5074, -0.1278),
            (51.5075, -0.1279)
        ]
    }
    """


    gss_code: str
    name: str
    lon_lat_points: Any

    model_config = {
        "from_attributes": True  # replaces orm_mode=True in Pydantic v1
    }