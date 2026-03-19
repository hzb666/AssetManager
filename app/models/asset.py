"""通用资产模型"""
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from app.core.time_utils import get_utc_now


class AssetBase(SQLModel):
    """通用资产基础模型 - 字段由配置文件定义"""
    code: str = Field(max_length=50, unique=True, index=True, description="资产编号")
    name: str = Field(max_length=200, index=True, description="资产名称")
    category: Optional[str] = Field(default=None, max_length=100, index=True, description="分类")
    brand: Optional[str] = Field(default=None, max_length=100, description="品牌")
    model: Optional[str] = Field(default=None, max_length=100, description="型号")
    serial_number: Optional[str] = Field(default=None, max_length=100, description="序列号")
    quantity: float = Field(default=1, description="数量")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    location: Optional[str] = Field(default=None, max_length=200, index=True, description="存放位置")
    purchase_price: Optional[float] = Field(default=None, description="采购价格")
    purchase_date: Optional[datetime] = Field(default=None, description="采购日期")
    warranty_end_date: Optional[datetime] = Field(default=None, description="保修截止日期")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")


class Asset(AssetBase, table=True):
    """通用资产数据库模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    status: str = Field(default="in_storage", index=True, description="资产状态")
    borrower_id: Optional[int] = Field(
        default=None,
        index=True,
        foreign_key="users.id",
        ondelete="SET NULL",
        description="当前借用人"
    )
    keeper_id: Optional[int] = Field(
        default=None,
        index=True,
        foreign_key="users.id",
        ondelete="SET NULL",
        description="保管人"
    )
    created_by_id: Optional[int] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        description="创建人"
    )
    created_at: datetime = Field(default_factory=get_utc_now, index=True, description="创建时间")
    updated_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column_kwargs={"onupdate": get_utc_now},
        description="更新时间"
    )


class AssetCreate(SQLModel):
    """创建资产 DTO"""
    code: str = Field(max_length=50)
    name: str = Field(max_length=200)
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    quantity: float = 1
    unit: Optional[str] = None
    location: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    warranty_end_date: Optional[datetime] = None
    notes: Optional[str] = None


class AssetUpdate(SQLModel):
    """更新资产 DTO"""
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    warranty_end_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class AssetResponse(SQLModel):
    """资产响应 DTO"""
    id: int
    code: str
    name: str
    category: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    serial_number: Optional[str]
    quantity: float
    unit: Optional[str]
    location: Optional[str]
    purchase_price: Optional[float]
    purchase_date: Optional[datetime]
    warranty_end_date: Optional[datetime]
    notes: Optional[str]
    status: str
    borrower_id: Optional[int]
    keeper_id: Optional[int]
    created_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime
