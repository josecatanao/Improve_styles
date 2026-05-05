'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const CHART_PALETTE = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
] as const

const CHART_PRIMARY = CHART_PALETTE[0]
const CHART_SECONDARY = CHART_PALETTE[1]

function getChartColor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

function formatTooltipValue(value: number, format?: 'currency' | 'number'): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  return value.toLocaleString('pt-BR')
}

type TimelineItem = {
  label: string
  value: number
  helper?: string
}

type MultiTimelineItem = {
  label: string
  orders: number
  revenue: number
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function HorizontalBarChart({
  title,
  description,
  items,
  config: customConfig,
  className,
  emptyMessage = 'Nenhum dado disponivel para este grafico.',
  valueFormat,
}: {
  title: string
  description: string
  items: TimelineItem[]
  config?: ChartConfig
  className?: string
  emptyMessage?: string
  valueFormat?: 'currency' | 'number'
}) {
  if (items.length === 0) {
    return (
      <ChartCard title={title} description={description} className={className}>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          {emptyMessage}
        </div>
      </ChartCard>
    )
  }

  const chartConfig = customConfig ?? Object.fromEntries(
    items.map((item, index) => [
      item.label,
      {
        label: item.label,
        color: getChartColor(index),
      },
    ])
  ) satisfies ChartConfig

  const dataKey = 'value'
  const chartData = items.map((item) => ({
    label: item.label,
    value: item.value,
    helper: item.helper,
  }))

  return (
    <ChartCard title={title} description={description} className={className}>
      <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            width={120}
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.2 }}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex min-w-32 items-baseline gap-2">
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatTooltipValue(Number(value), valueFormat)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey={dataKey} radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getChartColor(index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function TimelineBarChart({
  title,
  description,
  items,
  className,
  emptyMessage = 'Nenhum dado disponivel para este grafico.',
}: {
  title: string
  description: string
  items: MultiTimelineItem[]
  className?: string
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return (
      <ChartCard title={title} description={description} className={className}>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          {emptyMessage}
        </div>
      </ChartCard>
    )
  }

  const chartConfig = {
    revenue: {
      label: 'Receita',
      color: CHART_PRIMARY,
    },
    orders: {
      label: 'Pedidos',
      color: CHART_SECONDARY,
    },
  } satisfies ChartConfig

  return (
    <ChartCard title={title} description={description} className={className}>
      <ChartContainer config={chartConfig} className="aspect-auto h-[190px] w-full">
        <BarChart
          data={items}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          barCategoryGap={8}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.2 }}
            content={<ChartTooltipContent formatter={(value, name) => (
              <div className="flex min-w-24 items-baseline gap-2">
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {name === 'revenue'
                    ? formatTooltipValue(Number(value), 'currency')
                    : `${Number(value).toLocaleString('pt-BR')} pedidos`}
                </span>
              </div>
            )} />}
          />
          <Bar dataKey="revenue" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function TimelineAreaChart({
  title,
  description,
  items,
  className,
  emptyMessage = 'Nenhum dado disponivel.',
  valueFormat,
}: {
  title: string
  description: string
  items: TimelineItem[]
  className?: string
  emptyMessage?: string
  valueFormat?: 'currency' | 'number'
}) {
  if (items.length === 0) {
    return (
      <ChartCard title={title} description={description} className={className}>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          {emptyMessage}
        </div>
      </ChartCard>
    )
  }

  const chartConfig = {
    value: {
      label: title,
      color: CHART_PRIMARY,
    },
  } satisfies ChartConfig

  return (
    <ChartCard title={title} description={description} className={className}>
      <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
        <AreaChart
          data={items}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip
            cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex min-w-24 items-baseline gap-2">
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatTooltipValue(Number(value), valueFormat)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_PRIMARY}
            strokeWidth={2}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}
