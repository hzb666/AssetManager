/**
 * 仪表盘页面
 * 轻量级 Tab 容器：显示统计卡片 + 按需加载对应 Tab
 * activeTab 通过 localStorage 持久化
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Package, ArrowRightLeft, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { UserRoles } from '@/lib/constants'
import { useAuthStore } from '@/store/useStore'

import {
  type DashboardTab,
  DASHBOARD_TAB_STORAGE_KEY,
} from '../lib/dashboardUtils'
import { DashboardBorrowTab } from './dashboard/DashboardBorrowTab'
import { DashboardStockinTab } from './dashboard/DashboardStockinTab'

import { inventoryAPI } from '@/api/client'

function StatCard({
  title,
  icon: Icon,
  value,
  onClick,
  isActive,
}: Readonly<{
  title: string
  icon: React.ElementType
  value: React.ReactNode
  onClick: () => void
  isActive: boolean
}>) {
  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:bg-accent',
        isActive && 'border bg-accent/50 dark:border-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold flex h-8 items-center', isActive && 'text-primary')}>{value}</div>
      </CardContent>
    </Card>
  )
}

const ALL_TABS: DashboardTab[] = ['borrows', 'stockin']

function getSavedTab(allowedTabs: DashboardTab[]): DashboardTab {
  try {
    const saved = localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY)
    if (saved && allowedTabs.includes(saved as DashboardTab)) {
      return saved as DashboardTab
    }
  } catch {
    // ignore localStorage errors
  }
  return allowedTabs[0] ?? 'borrows'
}

function saveTab(tab: DashboardTab) {
  try {
    localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, tab)
  } catch {
    // ignore localStorage errors
  }
}

export function Dashboard() {
  const currentUser = useAuthStore((state) => state.user)
  const isPublicUser = currentUser?.role === UserRoles.PUBLIC
  const allowedTabs = useMemo(
    () => (isPublicUser ? (['borrows'] as DashboardTab[]) : ALL_TABS),
    [isPublicUser]
  )

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getSavedTab(allowedTabs))
  const [isLoading, setIsLoading] = useState(true)
  const [counts, setCounts] = useState({
    borrowCount: 0,
    stockinCount: 0,
  })

  const handleTabChange = useCallback((tab: DashboardTab) => {
    if (!allowedTabs.includes(tab)) {
      return
    }
    setActiveTab(tab)
    saveTab(tab)
  }, [allowedTabs])

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      const fallback = getSavedTab(allowedTabs)
      setActiveTab(fallback)
      saveTab(fallback)
    }
  }, [activeTab, allowedTabs])

  // 加载统计数量
  useEffect(() => {
    let cancelled = false

    const loadCounts = async () => {
      try {
        const [borrowRes, stockinRes] = await Promise.all([
          inventoryAPI.getMyBorrows(),
          inventoryAPI.getPendingStockin(),
        ])

        if (cancelled) return

        const borrowCount = (borrowRes.data?.data ?? []).length
        const stockinCount = (stockinRes.data?.data ?? []).length

        setCounts({ borrowCount, stockinCount })
      } catch {
        if (!cancelled) {
          setCounts({ borrowCount: 0, stockinCount: 0 })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCounts()
    return () => { cancelled = true }
  }, [activeTab, isPublicUser])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary card-title-placeholder">仪表盘</h1>
      </div>

      <div className={cn('grid gap-3', isPublicUser ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-2')}>
        <StatCard
          title="当前借用"
          icon={Package}
          value={isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : counts.borrowCount}
          onClick={() => handleTabChange('borrows')}
          isActive={activeTab === 'borrows'}
        />
        {!isPublicUser && (
          <StatCard
            title="待入库"
            icon={ArrowRightLeft}
            value={isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : counts.stockinCount}
            onClick={() => handleTabChange('stockin')}
            isActive={activeTab === 'stockin'}
          />
        )}
      </div>

      {activeTab === 'borrows' && <DashboardBorrowTab />}
      {!isPublicUser && activeTab === 'stockin' && <DashboardStockinTab />}
    </div>
  )
}
