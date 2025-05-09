from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import RecycleHistory, RecycleHistoryProductAssociation, Material, Product, User
from datetime import datetime

async def get_user_with_histories_eager(db: AsyncSession, user_id: int) -> User | None:
    """
    This function retrieves a user by their ID and eagerly loads their recycle histories,

    returns:
        User: The user object with recycle histories and associated products and materials.
    """
    stmt = (
        select(User)
        .options(
            selectinload(User.recycle_histories)
            .selectinload(RecycleHistory.product_associations)
            .selectinload(RecycleHistoryProductAssociation.product)
            .selectinload(Product.material)
        )
        .where(User.user_id == user_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def create_recycle_history(
    db: AsyncSession,
    user_id: int,
    recycling_point_id: int | None,
    product_quantities: dict[int, int],  # {product_id: quantity}
) -> RecycleHistory:
    """
    Create a new recycle history entry and associate it with products and quantities.
    
    returns:
        RecycleHistory: The created recycle history object.
    """
    # Create the recycle history record
    recycle_history = RecycleHistory(
        date=datetime.now(),
        user_id=user_id,
        point_id=recycling_point_id,
    )
    db.add(recycle_history)
    await db.flush()  # Get the recycle_history_id for association

    # Link products with quantities via the association table
    for product_id, quantity in product_quantities.items():
        stmt = select(Product).where(Product.barcode == product_id)
        result = await db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            raise ValueError(f"Product with ID {product_id} not found")

        association = RecycleHistoryProductAssociation(
                date=recycle_history.date,
                user_id=recycle_history.user_id,
                product_barcode=product.barcode,
                point_id=recycle_history.point_id,
                quantity=quantity
            )

        db.add(association)
        await db.commit()  # Commit after each association to ensure data integrity
        await db.refresh(association)  # Refresh the association to get the latest state

    await db.commit()
    await db.refresh(recycle_history)
    return recycle_history