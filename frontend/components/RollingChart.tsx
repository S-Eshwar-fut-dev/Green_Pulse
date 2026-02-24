"use client";

import { useEffect, useRef, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { VehicleEvent, ChartDataPoint } from "@/lib/types";
import { fetchFleet } from "@/lib/api";

const VEHICLE_COLORS: Record<string, string> = {
    "TRK-DL-001": "#00ff87",
    "TRK-DL-002": "#00ccff",
    "TRK-DL-003": "#ff9500",
    "TRK-DL-004": "#ff4444",
    "TRK-CH-001": "#c084fc",
    "TRK-CH-002": "#f472b6",
    "TRK-CH-003": "#34d399",
    "TRK-KL-001": "#fbbf24",
    "TRK-KL-002": "#a78bfa",
    "TRK-KL-003": "#fb923c",
};

export default function RollingChart() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    async function tick() {
        const vehicles = await fetchFleet();
        if (!vehicles.length) return;
        const ts = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const point: ChartDataPoint = { time: ts };
        for (const v of vehicles) {
            point[v.vehicle_id] = parseFloat((v.co2_kg ?? 0).toFixed(3));
        }
        setData((prev) => [...prev.slice(-19), point]);
    }

    useEffect(() => {
        tick();
        intervalRef.current = setInterval(tick, 2000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const vehicleIds = data.length
        ? Object.keys(data[0]).filter((k) => k !== "time")
        : [];

    return (
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: "#e6edf3", margin: "0 0 16px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Rolling CO₂ per Vehicle (kg, live 2s)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="time" tick={{ fill: "#8b949e", fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} unit=" kg" width={52} />
                    <Tooltip
                        contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8 }}
                        labelStyle={{ color: "#8b949e" }}
                        itemStyle={{ color: "#e6edf3" }}
                    />
                    <Legend wrapperStyle={{ color: "#8b949e", fontSize: 11 }} />
                    {vehicleIds.map((id) => (
                        <Line
                            key={id}
                            type="monotone"
                            dataKey={id}
                            stroke={VEHICLE_COLORS[id] ?? "#8b949e"}
                            dot={false}
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
