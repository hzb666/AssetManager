// frontend/src/lib/entityStatusMap.ts
import { entityConfig } from '@/config/entity'

export const statusMap: Record<string, { label: string; color: string }> = {
  request: { label: '申购', color: 'blue' },
  purchasing: { label: '采购中', color: 'yellow' },
  stock_in: { label: '入库', color: 'cyan' },
  in_storage: { label: '库存', color: 'green' },
  borrowed: { label: '已借出', color: 'orange' },
  maintenance: { label: '保修中', color: 'purple' },
  consumed: { label: '已用完', color: 'gray' },
  scrapped: { label: '已报废', color: 'red' },
  rejected: { label: '已拒绝', color: 'red' },
  pending: { label: '待审批', color: 'yellow' },
  approved: { label: '已审批', color: 'blue' },
  arrived: { label: '已到货', color: 'cyan' },
  stocked: { label: '已入库', color: 'green' },
  cancelled: { label: '已取消', color: 'gray' },
}

export function getStatusLabel(key: string): string {
  return statusMap[key]?.label || key
}

export function getStatusColor(key: string): string {
  return statusMap[key]?.color || 'default'
}
