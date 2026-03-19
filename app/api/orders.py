"""通用订单 API"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.database import get_db
from app.models import Order, OrderCreate, OrderUpdate, OrderResponse
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=dict)
async def list_orders(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
):
    """获取订单列表"""
    statement = select(Order)

    # 管理员可以看所有订单，普通用户只能看自己的
    if current_user.role != "admin":
        statement = statement.where(Order.applicant_id == current_user.id)

    if status:
        statement = statement.where(Order.status == status)
    if category:
        statement = statement.where(Order.category == category)

    # 获取总数
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # 添加排序和分页
    statement = statement.order_by(Order.created_at.desc())
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    orders = session.exec(statement).all()

    return {
        "items": [OrderResponse.model_validate(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取订单详情"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # 检查权限
    if current_user.role != "admin" and order.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限查看")

    return OrderResponse.model_validate(order)


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    order_data: OrderCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建订单"""
    order = Order(
        **order_data.model_dump(),
        applicant_id=current_user.id,
        status="pending",
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    return OrderResponse.model_validate(order)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_data: OrderUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新订单"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # 检查权限（只有创建者或管理员可以修改）
    if current_user.role != "admin" and order.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限修改")

    # 只能修改待审批的订单
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="当前状态不允许修改")

    update_data = order_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)

    session.add(order)
    session.commit()
    session.refresh(order)

    return OrderResponse.model_validate(order)


@router.post("/{order_id}/approve")
async def approve_order(
    order_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """审批通过订单"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单不是待审批状态")

    order.status = "approved"
    session.add(order)
    session.commit()

    return {"message": "审批通过"}


@router.post("/{order_id}/reject")
async def reject_order(
    order_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """驳回订单"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")

    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单不是待审批状态")

    order.status = "rejected"
    session.add(order)
    session.commit()

    return {"message": "订单已驳回"}


@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除订单"""
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # 检查权限
    if current_user.role != "admin" and order.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限删除")

    # 只能删除待审批的订单
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="当前状态不允许删除")

    session.delete(order)
    session.commit()

    return {"message": "删除成功"}
