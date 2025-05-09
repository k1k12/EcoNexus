from sqlalchemy import Column, Integer, String, Boolean, Float, Date, ForeignKey, Table, Time, ForeignKeyConstraint, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON, ARRAY, TIMESTAMP
from sqlalchemy.ext.associationproxy import association_proxy
from app.database.database import Base

print("Models imported")

recycling_point_material_association = Table(
    "recycling_point_material_association",
    Base.metadata,
    Column("recycling_point_id", Integer, ForeignKey("recycling_point.point_id"), primary_key=True),
    Column("material_id",Integer, ForeignKey("material.material_id"),primary_key=True),
    extend_existing=True
)
class RecycleHistoryProductAssociation(Base):
    """
    Association table linking a recycling history entry to a product.

    Represents how many units of a given product were recycled by a user at
    a specific point and time.
    """
    __tablename__ = "recycle_history_product_association"

    # fields
    date = Column(TIMESTAMP, primary_key=True)
    user_id = Column(Integer, primary_key=True)
    product_barcode = Column(String, ForeignKey("product.barcode"), primary_key=True)
    point_id = Column(Integer, ForeignKey("recycling_point.point_id"), primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

    # Relationships
    product = relationship("Product", back_populates="associations")
    recycling_point = relationship("RecyclingPoint", backref="recycle_history_product_associations")
    recycle_history = relationship("RecycleHistory", back_populates="product_associations")

    # Constraints
    __table_args__ = (
        ForeignKeyConstraint(
            ["date", "user_id"],
            ["recycle_history.date", "recycle_history.user_id"],
            ondelete="CASCADE",
        ),
    )

class User(Base):
    """
    Represents a user in the system.

    Users may be regular, council members, or admins. Council users can manage
    recycling points and may require approval.
    """
    __tablename__ = "user"

    # fields
    user_id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False) 
    role = Column(String, nullable=False)
    is_suspended = Column(Boolean, nullable=False)
    mfa_key = Column(String, nullable=False)
    gss_code = Column(String, ForeignKey("council.gss_code"), nullable=True)

    # relationships
    council = relationship("Council", backref="users")

    recycling_points = relationship(
        "RecyclingPoint",
        back_populates="user",
        passive_deletes=True,
        cascade="all, delete-orphan"
    )
    recycle_histories = relationship(
        "RecycleHistory",
        back_populates="user",
        passive_deletes=True,
        cascade="all, delete-orphan"
    )
    council_admin_entries = relationship(
        "Admin",
        back_populates="council_user",
        foreign_keys="[Admin.council_user_id]",
        cascade="all, delete-orphan"  # Add cascade delete
    )
    admin_entries = relationship(
        "Admin",
        back_populates="admin_user",
        foreign_keys="[Admin.admin_user_id]",
        cascade="all, delete-orphan"  # Add cascade delete
    )
class Council(Base):
    """
    Represents a local council area.

    Councils have a geographic area (defined by lon/lat points), and manage
    related recycling points and admin relationships.
    """
    __tablename__ = "council"

    # fields
    gss_code = Column(String, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    lon_lat_points = Column(JSON, nullable=False)

    # relationships
    recycling_points = relationship(
        "RecyclingPoint",
        back_populates="council",
        cascade="all, delete-orphan"
    )
    admins = relationship(
        "Admin",
        back_populates="council",
        cascade="all, delete-orphan"
    )
class Material(Base):
    """
    Represents a type of recyclable material (e.g., plastic, metal).

    Materials are linked to both recycling points and recyclable products.
    """
    __tablename__ = "material"

    name = Column(String, nullable=False)
    material_id = Column(Integer, primary_key=True, nullable=False)
    synonyms = Column(JSON, nullable=False)

    # relationships
    recycling_points = relationship(
        "RecyclingPoint",
        secondary=recycling_point_material_association,
        back_populates="materials",
    )
    products = relationship("Product", back_populates="material")
class RecyclingPoint(Base):
    """
    Represents a physical recycling location.

    Each recycling point is managed by a user and tied to a council.
    Accepts multiple materials and tracks recycling activity.
    """
    __tablename__ = "recycling_point"

    # fields
    point_id = Column(Integer, primary_key=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    gss_code = Column(String, ForeignKey("council.gss_code", ondelete="CASCADE"), nullable=False)
    times_open = Column(JSON)

    # relationships
    user = relationship(
        "User",
        back_populates="recycling_points",
        passive_deletes=True
    )
    materials = relationship(
        "Material",
        secondary=recycling_point_material_association,
        back_populates="recycling_points"
    )
    council = relationship(
        "Council",
        back_populates="recycling_points"
    )
    recycle_histories = relationship(
        "RecycleHistory",
        back_populates="recycling_point",
        cascade="all, delete-orphan"
    )
class Admin(Base):
    """
    Represents an admin approval record for a council user.

    Tracks who approved whom, when, and whether the council user is approved.
    """
    __tablename__ = "admin"

    # fields 
    date = Column(Date, nullable=False)
    council_user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    admin_user_id = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    gss_code = Column(String, ForeignKey("council.gss_code", ondelete="CASCADE"), nullable=False)
    is_approved = Column(Boolean, nullable=False)

    # composite keys
    __table_args__ = (
        PrimaryKeyConstraint('date', 'council_user_id'),
    )

    # relationships
    council_user = relationship(
        "User",
        back_populates="council_admin_entries",
        foreign_keys=[council_user_id],
        passive_deletes=True
    )
    admin_user = relationship(
        "User",
        back_populates="admin_entries",
        foreign_keys=[admin_user_id],
        passive_deletes=True

    )
    council = relationship(
        "Council",
        back_populates="admins"
    )
class Product(Base):
    """
    Represents a product that may be recyclable.

    Each product is linked to a material and can be associated with recycling history records.
    """
    __tablename__ = "product"

    # fields
    barcode = Column(String, primary_key=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    material_id = Column(Integer, ForeignKey("material.material_id"), nullable=False)
    # relationships
    material = relationship("Material", back_populates="products")
    recyclable = Column(Boolean, nullable=True)
    associations = relationship(
        "RecycleHistoryProductAssociation",
        cascade="all, delete-orphan"
    )
    recycle_histories = association_proxy("associations", "recycle_history")

class RecycleHistory(Base):
    """
    Represents a product that may be recyclable.

    Each product is linked to a material and can be associated with recycling history records.
    """
    __tablename__ = "recycle_history"

    # fields
    date = Column(TIMESTAMP, nullable=False)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    point_id = Column(Integer, ForeignKey("recycling_point.point_id"), nullable=True)

    # composite keys
    __table_args__ = (
        PrimaryKeyConstraint('date', 'user_id'), 
    )

    # relationships
    recycling_point = relationship(
        "RecyclingPoint",
        back_populates="recycle_histories"
    )
    user = relationship(
        "User",
        back_populates="recycle_histories",
        passive_deletes=True
    )
    product_associations = relationship(
    "RecycleHistoryProductAssociation",
    back_populates="recycle_history",
    cascade="all, delete-orphan"
)
    products = association_proxy("associations", "product")

if __name__ == "__main__":
    import asyncio
    async def create_all():
        from app.database.database import engine
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(create_all())
