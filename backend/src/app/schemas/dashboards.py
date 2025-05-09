from typing import Dict, Literal, Annotated, Union
from pydantic import BaseModel, Field


## DATA MODELS ##

class Progress(BaseModel):
    # TODO: decide on specific information for each field
    items_per_day_over_last_week: dict
    """
    {mon:num_of_recycles, tue:num_of_recycles, wed:num_of_recycles, thu:num_of_recycles, fri:num_of_recycles, sat:num_of_recycles, sun:num_of_recycles}
    """
    improvement_over_last_week: float 
    average_items_per_week_over_last_month: float # 4 weeks

class EnvironmentalImpact(BaseModel):
    """
    Schema for the environmental impact of recycling.
    
    example: {
        "turtles_saved": 0.5,
        "trees_saved": 1.0,
        "co2_saved": 10.0
    }
    """

    # TODO: feasibility of these calculations
    turtles_saved: float
    trees_saved: float
    co2_saved: float

class UserStatistics(BaseModel):
    """
    Schema for user statistics.
    
    example: {
        "materials_recycled": {
            "plastic_bottle": 10,
            "glass_bottle": 5
        }
    }
    """
    # TODO: decide on specific information for each field
    materials_recycled: Dict[str, int]  # {material_name: amount_recycled}


## RESPONSE MODELS ##

class User(BaseModel):
    """
    Schema for the user dashboard response.
    
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
            }
        }
    }
    """


    type: Literal["user"]
    progress: Progress
    environmental_impact: EnvironmentalImpact
    statistics: UserStatistics


class Council(BaseModel):
    """
    Schema for the council dashboard response.

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
            }
        }
    }
    """
    # TODO: what is "material frequency per recycling point"?
    type: Literal["council"]
    # include the total number of users registered in the app
    material_frequencies: Dict[int, Dict[str, int]]  # {recycling_point_id: {material_name: amount_recycled}} 

DashboardResponse = Annotated[
    Union[User, Council], 
    Field(discriminator="type")
]
