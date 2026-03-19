"""借用日志模型"""
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from app.core.time_utils import get_utc_now


class BorrowLog(SQLModel, table=True):
    """借用记录数据库模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(
        index=True,
        foreign_key="asset.id",
        ondelete="CASCADE",
        description="资产ID"
    )
    borrower_id: int = Field(
        index=True,
        foreign_key="users.id",
        ondelete="CASCADE",
        description="借用人"
    )
    borrow_time: datetime = Field(default_factory=get_utc_now, description="借用时间")
    return_time: Optional[datetime] = Field(default=None, description="归还时间")
    quantity_borrowed: float = Field(gt=0, description="借用数量")
    quantity_returned: Optional[float] = Field(default=None, description="归还数量")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")
    created_at: datetime = Field(default_factory=get_utc_now, description="创建时间")


class BorrowLogResponse(SQLModel):
    """借用日志响应 DTO"""
    id: int
    asset_id: int
    borrower_id: int
    borrow_time: datetime
    return_time: Optional[datetime]
    quantity_borrowed: float
    quantity_returned: Optional[float]
    notes: Optional[str]
    created_at: datetime
