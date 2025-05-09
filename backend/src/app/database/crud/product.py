from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.models import Product
from sqlalchemy.orm import selectinload

async def get_product(db: AsyncSession, barcode: str):
    """
    Retrieves a product by its EAN13 barcode

    Args:
        db (AsyncSession): Database session
        barcode (int): The barcode of the product

    Returns:
        Product or None: The product or None if not found
    """
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.material))
        .where(Product.barcode == barcode)
    )
    product = result.scalars().first()
    if not product:
        return None
    return product

async def add_product(db: AsyncSession, product: Product):
    """
    Creates a new recycling point in the database.

    Args:
        db (AsyncSession): Database session
        point (Product): The product data required to add a product to the DB

    Returns:
        Product: The created product object
    """
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
