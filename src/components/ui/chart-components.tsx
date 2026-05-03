'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
} as const

const FALLBACK_COLORS = [
  'hsl(221 83% 53%)',
  'hsl(142 71% 45%)',
  'hsl(30 90% 55%)',
  'hsl(262 83% 58%)',
  'hsl(340 82% 52%)',
  'hsl(190 80% 45%)',
  'hsl(45 93% 47%)',
  'hsl(280 65% 55%)',
]

function getChartColor(index: number) {
  const key = Object.keys(CHART_COLORS)[index % Object.keys(CHART_COLORS).length] as keyof typeof CHART_COLORS
  return CHART_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
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
              <rect
                key={`cell-${index}`}
                fill={getChartColor(index)}
                data-key={entry.label}
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
      color: 'hsl(var(--chart-1))',
    },
    orders: {
      label: 'Pedidos',
      color: 'hsl(var(--chart-2))',
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
          <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
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
      color: 'hsl(var(--chart-1))',
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
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}
