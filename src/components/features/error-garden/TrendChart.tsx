"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

type TrendChartProps = {
    data: number[] // array of decimals (0.0 to 1.0)
    labels: string[]
    color?: string
    height?: number
}

export function TrendChart({
    data,
    labels,
    color = "#10b981", // default emerald-500
    height = 200,
}: TrendChartProps) {
    const chartData = data.map((value, index) => ({
        name: labels[index] || `Week ${index + 1}`,
        value: value,
        percentage: Math.round(value * 100),
    }))

    // Parse color to rgb for gradient (generic helper)
    const getGradientId = () => `color-${color.replace("#", "")}`

    return (
        <div style={{ width: "100%", height }} className="trend-chart-container">
            <ResponsiveContainer>
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => `${Math.round(value * 100)}%`}
                        domain={[0, 1]}
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            color: "#fff",
                        }}
                        formatter={(value: number | undefined) => [
                            `${Math.round((value || 0) * 100)}%`,
                            "Frequency",
                        ]}
                        labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        fillOpacity={1}
                        fill={`url(#${getGradientId()})`}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
