from sqlalchemy.ext.asyncio import AsyncSession
from app.database.crud.recycle_history import create_recycle_history  # Your CRUD function
from app.schemas.recycle_history import RecycleResponse, RecycleHistory
from typing import Optional

async def create_recycle_entry_service(
    db: AsyncSession,
    user_id: int,
    recycling_point_id: Optional[int],
    product_quantities: dict[int, int],
):
    """
    Service for handling the creation of a recycle history entry.
    
    Args:
        db (AsyncSession): The database session.
        user_id (int): ID of the user performing the action.
        recycling_point_id (Optional[int]): Optional ID of the recycling point.
        product_quantities (dict[int, int]): Dictionary mapping product_id to quantity.
    
    Returns:
        RecycleHistory: The created recycle history record with associations.
    """
    # Here you could do additional logic such as logging, validation, etc.

    recycle_history = await create_recycle_history(
        db=db,
        user_id=user_id,
        recycling_point_id=recycling_point_id,
        product_quantities=product_quantities
    )
    recycle_history = RecycleHistory(
        date=recycle_history.date,
        user_id=recycle_history.user_id,
        recycling_point_id=recycling_point_id,
        products=product_quantities
    )

    response = RecycleResponse(
        message="Recycle history entry created successfully.",
        history=recycle_history
    )
    return response