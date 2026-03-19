/**
 * 资产列表页面
 * 通用资产管理功能：搜索、筛选、分页、CRUD操作
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react'

import { FilterTable } from '@/components/ui/FilterTable'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { assetAPI, type Asset, type AssetCreate } from '@/api/client'
import { useAuthStore } from '@/store/useStore'
import { isAdmin } from '@/lib/constants'
import { toast } from '@/lib/toast'
import type { FilterAPI } from '@/hooks/useTableState'
import { entityConfig } from '@/config/entity'

interface AssetFormData {
  code: string
  name: string
  category: string
  brand: string
  model: string
  serial_number: string
  quantity: number
  unit: string
  location: string
  purchase_price: string
  purchase_date: string
  warranty_end_date: string
  notes: string
}

const initialFormData: AssetFormData = {
  code: '',
  name: '',
  category: '',
  brand: '',
  model: '',
  serial_number: '',
  quantity: 1,
  unit: '',
  location: '',
  purchase_price: '',
  purchase_date: '',
  warranty_end_date: '',
  notes: ''
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'request', label: '申购' },
  { value: 'purchasing', label: '采购中' },
  { value: 'stock_in', label: '入库' },
  { value: 'in_storage', label: '库存' },
  { value: 'borrowed', label: '已借出' },
  { value: 'maintenance', label: '保修中' },
  { value: 'consumed', label: '已用完' },
  { value: 'scrapped', label: '已报废' },
  { value: 'rejected', label: '已拒绝' },
]

const SEARCH_FIELD_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'name', label: '名称' },
  { value: 'code', label: '资产编号' },
  { value: 'serial_number', label: '序列号' },
  { value: 'brand', label: '品牌' },
  { value: 'category', label: '分类' },
  { value: 'location', label: '位置' },
]

const CATEGORY_OPTIONS = [
  { value: 'equipment', label: '设备' },
  { value: 'instrument', label: '仪器' },
  { value: 'furniture', label: '家具' },
  { value: 'computer', label: '电脑' },
  { value: 'vehicle', label: '车辆' },
  { value: 'other', label: '其他' },
]

const UNIT_OPTIONS = [
  { value: '台', label: '台' },
  { value: '套', label: '套' },
  { value: '个', label: '个' },
  { value: '件', label: '件' },
  { value: '把', label: '把' },
  { value: '张', label: '张' },
]

export function AssetsPage() {
  const user = useAuthStore((state) => state.user)
  const isAdminUser = isAdmin(user)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState<AssetFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  // 加载分类列表
  useEffect(() => {
    assetAPI.listCategories().then(res => {
      setCategories(res.data.categories || [])
    }).catch(console.error)
  }, [])

  const handleInputChange = useCallback((field: keyof AssetFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingAsset(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      code: asset.code,
      name: asset.name,
      category: asset.category || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      quantity: asset.quantity,
      unit: asset.unit || '',
      location: asset.location || '',
      purchase_price: asset.purchase_price?.toString() || '',
      purchase_date: asset.purchase_date?.split('T')[0] || '',
      warranty_end_date: asset.warranty_end_date?.split('T')[0] || '',
      notes: asset.notes || ''
    })
    setIsDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.code || !formData.name) {
      toast.error('请填写资产编号和名称')
      return
    }

    setIsSubmitting(true)
    try {
      const data: AssetCreate = {
        code: formData.code,
        name: formData.name,
        category: formData.category || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serial_number: formData.serial_number || undefined,
        quantity: formData.quantity,
        unit: formData.unit || undefined,
        location: formData.location || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        purchase_date: formData.purchase_date || undefined,
        warranty_end_date: formData.warranty_end_date || undefined,
        notes: formData.notes || undefined,
      }

      if (editingAsset) {
        await assetAPI.update(editingAsset.id, data)
        toast.success('资产更新成功')
      } else {
        await assetAPI.create(data)
        toast.success('资产创建成功')
      }

      setIsDialogOpen(false)
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '操作失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, editingAsset])

  const handleDelete = useCallback(async (asset: Asset) => {
    if (!confirm(`确定要删除资产 "${asset.name}" 吗？`)) {
      return
    }

    try {
      await assetAPI.delete(asset.id)
      toast.success('资产删除成功')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '删除失败')
    }
  }, [])

  const handleBorrow = useCallback(async (asset: Asset) => {
    try {
      await assetAPI.borrow(asset.id)
      toast.success('借用成功')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '借用失败')
    }
  }, [])

  const handleReturn = useCallback(async (asset: Asset) => {
    try {
      await assetAPI.return(asset.id)
      toast.success('归还成功')
      window.location.reload()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || '归还失败')
    }
  }, [])

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => [
    {
      accessorKey: 'code',
      header: '资产编号',
      cell: ({ row }) => <span className="font-mono">{row.getValue('code') as string}</span>,
    },
    {
      accessorKey: 'name',
      header: '资产名称',
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
      accessorKey: 'quantity',
      header: '数量',
    },
    {
      accessorKey: 'unit',
      header: '单位',
      cell: ({ row }) => row.getValue('unit') || '-',
    },
    {
      accessorKey: 'location',
      header: '存放位置',
      cell: ({ row }) => row.getValue('location') || '-',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'in_storage' ? 'bg-green-100 text-green-800' :
            status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
            status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
            status === 'scrapped' || status === 'consumed' ? 'bg-gray-100 text-gray-800' :
            status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const asset = row.original as unknown as Asset
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleOpenEdit(asset)}
              title="编辑"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {asset.status === 'in_storage' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleBorrow(asset)}
                title="借用"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            )}
            {asset.status === 'borrowed' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleReturn(asset)}
                title="归还"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            )}
            {isAdminUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(asset)}
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ], [handleOpenEdit, handleDelete, handleBorrow, handleReturn, isAdminUser])

  const renderExpandedRow = useCallback((itemRaw: Record<string, unknown>) => {
    const item = itemRaw as unknown as Asset
    return (
      <div className="p-3 flex flex-col md:flex-row gap-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 flex-1">
          <div>型号：{item.model || '-'}</div>
          <div>序列号：{item.serial_number || '-'}</div>
          <div>采购价格：{item.purchase_price ? `¥${item.purchase_price}` : '-'}</div>
          <div>采购日期：{item.purchase_date ? item.purchase_date.split('T')[0] : '-'}</div>
          <div>保修截止：{item.warranty_end_date ? item.warranty_end_date.split('T')[0] : '-'}</div>
          <div>创建时间：{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</div>
          <div className="col-span-2 md:col-span-3">备注：{item.notes || '-'}</div>
        </div>
      </div>
    )
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary card-title-placeholder">资产管理</h1>
        {isAdminUser && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            添加资产
          </Button>
        )}
      </div>

      <FilterTable
        api={assetAPI as unknown as FilterAPI}
        queryKey={['assets']}
        tableId="assets-table"
        customColumns={columns}
        statusOptions={STATUS_OPTIONS}
        searchFieldOptions={SEARCH_FIELD_OPTIONS}
        title={<><Package className="w-5 h-5" /> 资产列表</>}
        searchPlaceholder="搜索名称、编号、序列号..."
        renderExpandedRow={renderExpandedRow}
        noteField="notes"
      />

      {/* 创建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? '编辑资产' : '添加资产'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">资产编号 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="请输入资产编号"
                  disabled={!!editingAsset}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">资产名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入资产名称"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
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
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">序列号</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  placeholder="请输入序列号"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">单位</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">存放位置</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="请输入存放位置"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">采购价格</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.purchase_price}
                  onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                  placeholder="请输入采购价格"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">采购日期</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_end_date">保修截止日期</Label>
              <Input
                id="warranty_end_date"
                type="date"
                value={formData.warranty_end_date}
                onChange={(e) => handleInputChange('warranty_end_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="请输入备注"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : (editingAsset ? '保存' : '创建')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
