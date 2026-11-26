import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/cn'

const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        dir="ltr"
        className={cn(
          'flex w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-ink-mute [&_.recharts-cartesian-grid_line]:stroke-hairline/70 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-accent/40 [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-hairline [&_.recharts-radial-bar-background-sector]:fill-paper/70 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-ink/[0.04] dark:[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-white/[0.05] [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.theme || item.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipPayloadItem {
  name?: string
  dataKey?: string | number
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  labelKey?: string
  labelFormatter?: (
    label: React.ReactNode,
    payload: TooltipPayloadItem[],
  ) => React.ReactNode
  formatter?: (
    value: unknown,
    name: string,
    item: TooltipPayloadItem,
    index: number,
    payload: Record<string, unknown>,
  ) => React.ReactNode
  valueFormatter?: (value: unknown, item: TooltipPayloadItem) => React.ReactNode
}

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
  valueFormatter,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const firstItem = payload[0]
  const rawLabelKey = labelKey || String(firstItem?.dataKey || firstItem?.name || 'value')
  const firstConfig = config[rawLabelKey]
  const computedLabel = !hideLabel
    ? labelFormatter
      ? labelFormatter(label, payload)
      : firstConfig?.label || label
    : null

  return (
    <div
      className={cn(
        'glass-popover grid min-w-[10rem] items-start gap-1.5 rounded-xl px-3 py-2.5 text-xs text-ink',
        className,
      )}
    >
      {computedLabel !== null && computedLabel !== undefined && (
        <div className="border-b border-hairline/70 pb-1.5 font-mono text-[11px] font-semibold text-ink">
          {computedLabel}
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(nameKey || item.name || item.dataKey || 'value')
          const itemConfig = config[key] || config[String(item.dataKey || '')]
          const payloadFill =
            typeof item.payload?.color === 'string'
              ? item.payload.color
              : typeof item.payload?.fill === 'string'
                ? item.payload.fill
                : undefined
          const indicatorColor = item.color || payloadFill || itemConfig?.color || 'var(--color-accent)'

          return (
            <div
              key={`${key}-${index}`}
              className={cn(
                'flex w-full items-center justify-between gap-4',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item.value !== undefined ? (
                formatter(
                  item.value,
                  key,
                  item,
                  index,
                  item.payload ?? {},
                )
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    {!hideIndicator && (
                      <span
                        className={cn(
                          'shrink-0 rounded-[3px]',
                          indicator === 'dot' && 'size-2.5 rounded-full',
                          indicator === 'line' && 'h-3 w-1',
                          indicator === 'dashed' && 'h-3 w-0 border-s-2 border-dashed',
                        )}
                        style={{
                          backgroundColor:
                            indicator === 'dashed' ? 'transparent' : indicatorColor,
                          borderColor: indicatorColor,
                        }}
                      />
                    )}
                    <span className="truncate text-ink-soft">
                      {itemConfig?.label || item.name}
                    </span>
                  </div>
                  {item.value !== undefined && (
                    <span className="font-mono font-semibold tabular-nums text-ink">
                      {valueFormatter
                        ? valueFormatter(item.value, item)
                        : typeof item.value === 'number'
                          ? item.value.toLocaleString('en-US')
                          : item.value}
                    </span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
