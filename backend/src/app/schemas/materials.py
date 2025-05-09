from pydantic import BaseModel, Field
from typing import List


class Material(BaseModel):
    """
    Schema for the material object.
    
    Attributes:
        id (int): ID of the material
        name (str): Name of the material
        synonyms: List[str]: List of synonyms for the material
        
    """
    material_id: int
    name: str
    synonyms: List[str]

    class Config:
        from_attributes = True

## RESPONSE ##
class MaterialsResponse(BaseModel):
    """
    Schema for the response of a material.
    
    Attributes:
        materials: List[Material]: List of materials
    """
    materials: List[Material]
