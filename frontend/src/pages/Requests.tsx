/**
 * 申购订单管理页面
 * 通用订单管理功能：列表、状态筛选、审批/驳回操作
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

import { FilterTable } from '@/components/ui/FilterTable'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { orderAPI, type Order, type OrderCreate } from '@/api/client'
import { useAuthStore } from '@/store/useStore'
import { isAdmin } from '@/lib/constants'
import { toast } from '@/lib/toast'
import type { FilterAPI } from '@/hooks/useTableState'

interface OrderFormData {
  name: string
  category: string
  brand: string
  model: string
  specification: string
  quantity: number
  unit: string
  price: string
  notes: string
}

const initialFormData: OrderFormData = {
  name: '',
  category: '',
  brand: '',
  model: '',
  specification: '',
  quantity: 1,
  unit: '',
  price: '',
  notes: ''
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'purchasing', label: '采购中' },
  { value: 'arrived', label: '已到货' },
  { value: 'stocked', label: '已入库' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已取消' },
]

const SEARCH_FIELD_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'name', label: '物品名称' },
  { value: 'brand', label: '品牌' },
  { value: 'category', label: '分类' },
]

const CATEGORY_OPTIONS = [
  { value: 'equipment', label: '设备' },
  { value: 'instrument', label: '仪器' },
  { value: 'furniture', label: '家具' },
  { value: 'computer', label: '电脑' },
  { value: 'stationery', label: '文具' },
  { value: 'other', label: '其他' },
]

const UNIT_OPTIONS = [
  { value: '台', label: '台' },
  { value: '套', label: '套' },
  { value: '个', label: '个' },
  { value: '件', label: '件' },
  { value: '把', label: '把' },
  { value: '张', label: '张' },
  { value: '本', label: '本' },
  { value: '盒', label: '盒' },
]

export function RequestsPage() {
  const user = useAuthStore((state) => state.user)
  const isAdminUser = isAdmin(user)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState<OrderFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = useCallback((field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingOrder(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((order: Order) => {
    if (order.status !== 'pending') {
      toast.error('只能修改待审批的订单')
      return
    }
    setEditingOrder(order)
    setFormData({
      name: order.name,
      category: order.category || '',
      brand: order.brand || '',
      model: order.model || '',
      specification: order.specification || '',
      quantity: order.quantity,
      unit: order.unit || '',
      price: order.price.toString(),
      notes: order.notes || ''
    })
    setIsDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.name || formData.quantity < 1) {
      toast.error('请填写物品名称和数量')
      return
    }

    setIsSubmitting(true)
    try {
      const data: OrderCreate = {
        name: formData.name,
        category: formData.category || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        specification: formData.specification || undefined,
        quantity: formData.quantity,
        unit: formData.unit || undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        notes: formData.notes || undefined,
      }

      if (editingOrder) {
        await orderAPI.update(editingOrder.id, data)
        toast.success('订单更新成功')
      } else {
        await orderAPI.create(data)
        toast.success('订单创建成功')
      }

      setIsDialogOpen(false)
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '操作失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, editingOrder])

  const handleDelete = useCallback(async (order: Order) => {
    if (order.status !== 'pending') {
      toast.error('只能删除待审批的订单')
      return
    }
    if (!confirm(`确定要删除订单 "${order.name}" 吗？`)) {
      return
    }

    try {
      await orderAPI.delete(order.id)
      toast.success('订单删除成功')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '删除失败')
    }
  }, [])

  const handleApprove = useCallback(async (order: Order) => {
    try {
      await orderAPI.approve(order.id)
      toast.success('审批通过')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '审批失败')
    }
  }, [])

  const handleReject = useCallback(async (order: Order) => {
    const reason = prompt('请输入驳回原因：')
    if (!reason) {
      return
    }
    try {
      await orderAPI.reject(order.id)
      toast.success('订单已驳回')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '驳回失败')
    }
  }, [])

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: '物品名称',
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => row.getValue('category') || '-',
    },
    {
      accessorKey: 'brand',
      header: '品牌',
      cell: ({ row }) => row.getValue('brand') || '-',
    },
    {
      accessorKey: 'model',
      header: '型号',
      cell: ({ row }) => row.getValue('model') || '-',
    },
    {
      accessorKey: 'specification',
      header: '规格',
      cell: ({ row }) => row.getValue('specification') || '-',
    },
    {
      accessorKey: 'quantity',
      header: '数量',
    },
    {
      accessorKey: 'unit',
      header: '单位',
      cell: ({ row }) => row.getValue('unit') || '-',
    },
    {
      accessorKey: 'price',
      header: '单价',
      cell: ({ row }) => `¥${row.getValue('price')}`,
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            status === 'approved' ? 'bg-green-100 text-green-800' :
            status === 'purchasing' ? 'bg-blue-100 text-blue-800' :
            status === 'arrived' ? 'bg-purple-100 text-purple-800' :
            status === 'stocked' ? 'bg-green-100 text-green-800' :
            status === 'rejected' || status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return date ? new Date(date).toLocaleString() : '-'
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const order = row.original as unknown as Order
        return (
          <div className="flex items-center gap-1">
            {order.status === 'pending' && !isAdminUser && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenEdit(order)}
                  title="编辑"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(order)}
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {isAdminUser && order.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600"
                  onClick={() => handleApprove(order)}
                  title="审批通过"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleReject(order)}
                  title="驳回"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ], [handleOpenEdit, handleDelete, handleApprove, handleReject, isAdminUser])

  const renderExpandedRow = useCallback((itemRaw: Record<string, unknown>) => {
    const item = itemRaw as unknown as Order
    return (
      <div className="p-3 flex flex-col md:flex-row gap-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 flex-1">
          <div>型号：{item.model || '-'}</div>
          <div>规格：{item.specification || '-'}</div>
          <div>总价：¥{item.price * item.quantity}</div>
          <div>创建时间：{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</div>
          <div>更新时间：{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</div>
          <div className="col-span-2 md:col-span-3">备注：{item.notes || '-'}</div>
        </div>
      </div>
    )
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary card-title-placeholder">申购管理</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          创建申购
        </Button>
      </div>

      <FilterTable
        api={orderAPI as unknown as FilterAPI}
        queryKey={['orders']}
        tableId="orders-table"
        customColumns={columns}
        statusOptions={STATUS_OPTIONS}
        searchFieldOptions={SEARCH_FIELD_OPTIONS}
        title={<><ShoppingCart className="w-5 h-5" /> 申购订单</>}
        searchPlaceholder="搜索物品名称、品牌..."
        renderExpandedRow={renderExpandedRow}
        noteField="notes"
      />

      {/* 创建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? '编辑订单' : '创建申购'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">物品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入物品名称"
                disabled={!!editingOrder && editingOrder.status !== 'pending'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">品牌</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="请输入品牌"
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">型号</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="请输入型号"
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specification">规格</Label>
                <Input
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => handleInputChange('specification', e.target.value)}
                  placeholder="请输入规格"
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">单位</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">单价</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="请输入单价"
                  disabled={!!editingOrder && editingOrder.status !== 'pending'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="请输入备注"
                rows={3}
                disabled={!!editingOrder && editingOrder.status !== 'pending'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : (editingOrder ? '保存' : '创建')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
