########## Imports ##########

from pydantic import BaseModel
from app.schemas.materials import Material
from typing import Optional

########## Models ##########
class ProductResponse(BaseModel):
    name: str
    material: Material
    recyclable: Optional[bool] = None
    barcode: str
    model_config = {"from_attributes": True}

class ProductRequest(BaseModel):
    name: str
    barcode: str
    material: Material
    recyclable: Optional[bool] = None
    model_config = {"from_attributes": True}
