<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.dashboard') }}</h1>
      <div class="date-range-controls no-print">
        <Select v-model="quickRange" :options="quickRanges" option-label="label" option-value="value" @change="applyQuickRange" />
        <DatePicker v-model="dateRange" selection-mode="range" date-format="dd.mm.yy" :show-icon="true" @hide="onDateRangeChange" />
      </div>
    </div>

    <div v-if="pending" class="loading"><ProgressSpinner /></div>

    <template v-else-if="stats">
      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('stats.totalOrders') }}</div>
          <div class="kpi-value">{{ stats.totalOrders }}</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">{{ $t('stats.revenue') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.totalRevenue) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('stats.materialCost') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.totalMaterialCost) }}</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">{{ $t('stats.netProfit') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.totalNetProfit) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('stats.tax') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.totalTax) }}</div>
        </div>
        <div class="kpi-card success-dark">
          <div class="kpi-label">{{ $t('stats.profitAfterTax') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.totalProfitAfterTax) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('stats.avgOrderValue') }}</div>
          <div class="kpi-value">{{ formatMoney(stats.avgOrderValue) }}</div>
        </div>
      </div>

      <!-- Status badges summary -->
      <div class="status-summary">
        <div class="status-summary-group">
          <h3>{{ $t('field.acceptanceStatus') }}</h3>
          <div class="status-counts">
            <div>Oczekuje: <strong>{{ stats.statusCounts.acceptance.PENDING }}</strong></div>
            <div>Zaakceptowane: <strong>{{ stats.statusCounts.acceptance.ACCEPTED }}</strong></div>
          </div>
        </div>
        <div class="status-summary-group">
          <h3>{{ $t('field.paymentStatus') }}</h3>
          <div class="status-counts">
            <div>Do opłacenia: <strong>{{ stats.statusCounts.payment.PENDING }}</strong></div>
            <div>Zaliczka: <strong>{{ stats.statusCounts.payment.DEPOSIT_PAID }}</strong></div>
            <div>Opłacone: <strong>{{ stats.statusCounts.payment.PAID }}</strong></div>
          </div>
        </div>
        <div class="status-summary-group">
          <h3>{{ $t('field.deliveryStatus') }}</h3>
          <div class="status-counts">
            <div>Oczekuje: <strong>{{ stats.statusCounts.delivery.PENDING }}</strong></div>
            <div>W dostawie: <strong>{{ stats.statusCounts.delivery.IN_DELIVERY }}</strong></div>
            <div>Dostarczone: <strong>{{ stats.statusCounts.delivery.DELIVERED }}</strong></div>
            <div>Zakończone: <strong>{{ stats.statusCounts.delivery.COMPLETED }}</strong></div>
          </div>
        </div>
      </div>

      <!-- Monthly chart -->
      <div v-if="stats.byMonth?.length" class="chart-section">
        <h3>{{ $t('stats.monthlyChart') }}</h3>
        <Chart type="bar" :data="chartData" :options="chartOptions" style="height: 280px" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Stats {
  totalOrders: number
  totalRevenue: number
  totalMaterialCost: number
  totalNetProfit: number
  totalTax: number
  totalProfitAfterTax: number
  avgOrderValue: number
  statusCounts: {
    acceptance: { PENDING: number; ACCEPTED: number }
    payment: { PENDING: number; DEPOSIT_PAID: number; PAID: number }
    delivery: { PENDING: number; IN_DELIVERY: number; DELIVERED: number; COMPLETED: number }
  }
  byMonth: { month: string; revenue: number; profit: number; orders: number }[]
}

const now = new Date()
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

const dateRange = ref<Date[]>([firstOfMonth, now])
const quickRange = ref('month')

const quickRanges = [
  { label: 'Ten miesiąc', value: 'month' },
  { label: 'Ten rok', value: 'year' },
  { label: 'Ostatnie 30 dni', value: '30d' },
  { label: 'Ostatnie 90 dni', value: '90d' },
]

function applyQuickRange() {
  const now = new Date()
  if (quickRange.value === 'month') {
    dateRange.value = [new Date(now.getFullYear(), now.getMonth(), 1), now]
  } else if (quickRange.value === 'year') {
    dateRange.value = [new Date(now.getFullYear(), 0, 1), now]
  } else if (quickRange.value === '30d') {
    dateRange.value = [new Date(now.getTime() - 30 * 86400000), now]
  } else if (quickRange.value === '90d') {
    dateRange.value = [new Date(now.getTime() - 90 * 86400000), now]
  }
}

const fromParam = computed(() => dateRange.value[0]?.toISOString().slice(0, 10))
const toParam = computed(() => dateRange.value[1]?.toISOString().slice(0, 10))

const { data: stats, pending, refresh } = await useFetch<Stats>('/api/stats', {
  query: computed(() => ({ from: fromParam.value, to: toParam.value })),
})

function onDateRangeChange() {
  if (dateRange.value[0] && dateRange.value[1]) refresh()
}

function formatMoney(v: number) {
  return Number(v ?? 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

const chartData = computed(() => {
  const months = stats.value?.byMonth ?? []
  return {
    labels: months.map(m => m.month),
    datasets: [
      {
        label: 'Przychód',
        data: months.map(m => m.revenue),
        backgroundColor: 'rgba(180, 138, 114, 0.7)',
        borderColor: '#b48a72',
        borderWidth: 1,
      },
      {
        label: 'Zysk netto',
        data: months.map(m => m.profit),
        backgroundColor: 'rgba(140, 98, 80, 0.7)',
        borderColor: '#8c6250',
        borderWidth: 1,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: { y: { beginAtZero: true } },
}
</script>

<style scoped>
.date-range-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 20px;
}

.kpi-card.accent { border-left: 3px solid var(--accent); }
.kpi-card.success { border-left: 3px solid #4caf77; }
.kpi-card.success-dark { border-left: 3px solid #2e7d50; background: #f4fdf7; }

.kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
.kpi-value { font-size: 22px; font-weight: 900; color: var(--text); }

.status-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.status-summary-group {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
}

.status-summary-group h3 { margin: 0 0 10px; font-size: 13px; color: var(--accent-dark); }

.status-counts { font-size: 13px; display: flex; flex-direction: column; gap: 4px; }

.chart-section {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
}

.chart-section h3 { margin: 0 0 14px; font-size: 14px; }

@media (max-width: 768px) {
  .status-summary { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
}
</style>
