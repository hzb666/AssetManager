"""通用订单模型"""
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel
from app.core.time_utils import get_utc_now


class OrderStatus(str, Enum):
    """订单状态枚举"""
    PENDING = "pending"       # 待审批
    APPROVED = "approved"     # 已审批
    PURCHASING = "purchasing" # 采购中
    ARRIVED = "arrived"       # 已到货
    STOCKED = "stocked"       # 已入库
    REJECTED = "rejected"     # 已拒绝
    CANCELLED = "cancelled"   # 已取消


class OrderBase(SQLModel):
    """通用订单基础模型"""
    name: str = Field(max_length=200, index=True, description="物品名称")
    category: Optional[str] = Field(default=None, max_length=100, description="分类")
    brand: Optional[str] = Field(default=None, max_length=100, description="品牌")
    model: Optional[str] = Field(default=None, max_length=100, description="型号")
    specification: Optional[str] = Field(default=None, max_length=100, description="规格")
    quantity: int = Field(gt=0, description="数量")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    price: float = Field(ge=0, description="单价")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")


class Order(OrderBase, table=True):
    """通用订单数据库模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    applicant_id: Optional[int] = Field(
        default=None,
        index=True,
        foreign_key="users.id",
        ondelete="SET NULL",
        description="申请人"
    )
    status: str = Field(default=OrderStatus.PENDING, index=True, description="订单状态")
    created_at: datetime = Field(default_factory=get_utc_now, index=True, description="创建时间")
    updated_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column_kwargs={"onupdate": get_utc_now},
        description="更新时间"
    )


class OrderCreate(SQLModel):
    """创建订单 DTO"""
    name: str = Field(max_length=200)
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    specification: Optional[str] = None
    quantity: int = Field(gt=0)
    unit: Optional[str] = None
    price: float = Field(ge=0)
    notes: Optional[str] = None


class OrderUpdate(SQLModel):
    """更新订单 DTO"""
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    specification: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class OrderResponse(SQLModel):
    """订单响应 DTO"""
    id: int
    name: str
    category: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    specification: Optional[str]
    quantity: int
    unit: Optional[str]
    price: float
    notes: Optional[str]
    applicant_id: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime
