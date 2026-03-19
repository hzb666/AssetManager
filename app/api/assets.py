"""通用资产 API"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.database import get_db
from app.models import Asset, AssetCreate, AssetUpdate, AssetResponse
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=dict)
async def list_assets(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    order_by: str = "created_at",
    order_desc: bool = True,
):
    """获取资产列表"""
    statement = select(Asset)

    # 添加筛选条件
    if search:
        statement = statement.where(
            (Asset.name.contains(search)) |
            (Asset.code.contains(search)) |
            (Asset.serial_number.contains(search))
        )
    if category:
        statement = statement.where(Asset.category == category)
    if status:
        statement = statement.where(Asset.status == status)
    if location:
        statement = statement.where(Asset.location.contains(location))

    # 获取总数
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # 添加排序
    order_column = getattr(Asset, order_by, Asset.created_at)
    if order_desc:
        statement = statement.order_by(order_column.desc())
    else:
        statement = statement.order_by(order_column.asc())

    # 添加分页
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # 执行查询
    assets = session.exec(statement).all()

    return {
        "items": [AssetResponse.model_validate(a) for a in assets],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取资产详情"""
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")
    return AssetResponse.model_validate(asset)


@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(
    asset_data: AssetCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建资产"""
    # 检查编号是否已存在
    existing = session.exec(
        select(Asset).where(Asset.code == asset_data.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="资产编号已存在")

    # 创建资产
    asset = Asset(
        **asset_data.model_dump(),
        status="in_storage",
        created_by_id=current_user.id,
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)

    return AssetResponse.model_validate(asset)


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新资产"""
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    # 更新字段
    update_data = asset_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(asset, key, value)

    session.add(asset)
    session.commit()
    session.refresh(asset)

    return AssetResponse.model_validate(asset)


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除资产"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    session.delete(asset)
    session.commit()

    return {"message": "删除成功"}


# 借用相关 API
@router.post("/{asset_id}/borrow")
async def borrow_asset(
    asset_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """借用资产"""
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    if asset.status != "in_storage":
        raise HTTPException(status_code=400, detail="资产当前不可借用")

    # 更新状态
    asset.status = "borrowed"
    asset.borrower_id = current_user.id
    session.add(asset)
    session.commit()

    return {"message": "借用成功"}


@router.post("/{asset_id}/return")
async def return_asset(
    asset_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """归还资产"""
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")

    if asset.status != "borrowed":
        raise HTTPException(status_code=400, detail="资产未被借用")

    # 更新状态
    asset.status = "in_storage"
    asset.borrower_id = None
    session.add(asset)
    session.commit()

    return {"message": "归还成功"}


@router.get("/categories/list")
async def list_categories(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取分类列表"""
    categories = session.exec(
        select(Asset.category).where(Asset.category.isnot(None)).distinct()
    ).all()
    return {"categories": [c for c in categories if c]}


@router.get("/brands/list")
async def list_brands(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取品牌列表"""
    brands = session.exec(
        select(Asset.brand).where(Asset.brand.isnot(None)).distinct()
    ).all()
    return {"brands": [b for b in brands if b]}
