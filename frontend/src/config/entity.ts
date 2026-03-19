/** 资产配置 - 与后端 entity.yaml 同步 */
export const entityConfig = {
  entity: {
    code: 'asset',
    name: '资产',
    nameEn: 'Asset',
  },
  fields: [
    { key: 'code', label: '资产编号', labelEn: 'Asset Code', type: 'string', required: true, unique: true },
    { key: 'name', label: '资产名称', labelEn: 'Asset Name', type: 'string', required: true },
    { key: 'category', label: '分类', labelEn: 'Category', type: 'select', enabled: true },
    { key: 'brand', label: '品牌', labelEn: 'Brand', type: 'autocomplete', enabled: true },
    { key: 'model', label: '型号', labelEn: 'Model', type: 'string', enabled: true },
    { key: 'serial_number', label: '序列号', labelEn: 'Serial Number', type: 'string', enabled: true },
    { key: 'quantity', label: '数量', labelEn: 'Quantity', type: 'number', required: true, default: 1 },
    { key: 'unit', label: '单位', labelEn: 'Unit', type: 'select', enabled: true },
    { key: 'location', label: '存放位置', labelEn: 'Location', type: 'string', enabled: true },
    { key: 'purchase_price', label: '采购价格', labelEn: 'Purchase Price', type: 'number', enabled: true },
    { key: 'purchase_date', label: '采购日期', labelEn: 'Purchase Date', type: 'date', enabled: true },
    { key: 'warranty_end_date', label: '保修截止日期', labelEn: 'Warranty End Date', type: 'date', enabled: true },
    { key: 'notes', label: '备注', labelEn: 'Notes', type: 'textarea', enabled: true },
  ],
  lifecycle: {
    stages: [
      { key: 'request', label: '申购', is_initial: true },
      { key: 'purchasing', label: '采购中' },
      { key: 'stock_in', label: '入库' },
      { key: 'in_storage', label: '库存' },
      { key: 'borrowed', label: '已借出' },
      { key: 'maintenance', label: '保修中' },
      { key: 'consumed', label: '已用完', is_final: true },
      { key: 'scrapped', label: '已报废', is_final: true },
      { key: 'rejected', label: '已拒绝', is_final: true },
    ]
  }
}

export type FieldConfig = typeof entityConfig.fields[number]
export type LifecycleStage = typeof entityConfig.lifecycle.stages[number]
