########## Imports ##########
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

########## Models ##########
class RecycleHistory(BaseModel):
    ##    Schema for a recycling history entry.
    date: datetime
    user_id: int
    recycling_point_id: Optional[int] = None
    products: Dict[str, int]


class RecycleResponse(BaseModel):
    ##    Schema for the response of "POST /recycle" endpoint.
    message: str
    history: RecycleHistory

class RecycleRequest(BaseModel):
    ##    Schema for the request body of "POST /recycle" endpoint.
    recycling_point_id: Optional[int] = None
    product_quantities: Dict[str, int]
