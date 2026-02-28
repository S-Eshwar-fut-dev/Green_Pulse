"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { useFleet } from "@/lib/FleetContext";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { Clock, Fuel, TriangleAlert, MoveRight } from "lucide-react";
import Link from "next/link";
import MetricModal from "@/components/MetricModal";

const IndiaMap = dynamic(() => import("@/components/IndiaMap"), { ssr: false });

interface Ranking {
    vehicle_id: string;
    route: string;
    co2_kg: number;
    co2_per_km: number;
    score: number;
    status: string;
}
export default function OverviewPage() {
    const { vehicles, anomalies, stats, selectedVehicleId, setSelectedVehicleId } = useFleet();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [rankings, setRankings] = useState<Ranking[]>([]);

    const activeVehiclesCount = vehicles.length;
    const totalCo2 = stats.totalCo2.toFixed(0);
    const avgEff = stats.avgEfficiency.toFixed(1);

    const onTimePct = activeVehiclesCount > 0 ? ((stats.onTimeCount / activeVehiclesCount) * 100).toFixed(1) : "0.0";
    const totalFuel = vehicles.reduce((s, v) => s + (v.fuel_consumed_liters || 0), 0).toFixed(0);

    useEffect(() => {
        async function fetchRankings() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/api/fleet-rankings`);
                if (res.ok) {
                    const data = await res.json();
                    setRankings(data.data || []);
                }
            } catch {
                setRankings(vehicles.map(v => ({
                    vehicle_id: v.vehicle_id,
                    route: v.route_id,
                    co2_kg: v.co2_kg || 0,
                    co2_per_km: 0.03,
                    score: 3,
                    status: v.status,
                })));
            }
        }
        if (vehicles.length > 0) fetchRankings();
    }, [vehicles]);

    const trendData = [
        { time: "08:00", val: 20 },
        { time: "10:00", val: 35 },
        { time: "12:00", val: 30 },
        { time: "14:00", val: 45 },
        { time: "16:00", val: 40 },
        { time: "18:00", val: 55 },
        { time: "20:00", val: 65 },
    ];

    const criticalAnomalies = anomalies.filter(a => a.severity === "CRITICAL");
    const topDanger = criticalAnomalies[0];

    return (
        <div style={{ display: "flex", width: "100%", height: "calc(100vh - 64px)", overflow: "hidden" }}>

            {/* LEFT PANEL: 60% Hero Map */}
            <div style={{ width: "60%", position: "relative", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column" }}>

                {/* Overlaid Header */}
                <div style={{ position: "absolute", top: 32, left: 40, zIndex: 1000, pointerEvents: "none" }}>
                    <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
                        Freight Corridor Overview
                    </h1>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 12px", borderRadius: 20 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                        <span style={{ color: "#10B981", fontSize: "0.75rem", fontWeight: 600 }}>Live System Status: Optimal</span>
                    </div>
                </div>

                {/* The Map itself */}
                <div style={{ flex: 1, position: "relative" }}>
                    <IndiaMap vehicles={vehicles} onVehicleClick={setSelectedVehicleId} selectedVehicleId={selectedVehicleId} />
                </div>

                {/* Floating Stat Cards placed at the bottom */}
                <div style={{ position: "absolute", bottom: 40, left: 40, right: 40, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, zIndex: 1000 }}>

                    {/* Active Vehicles */}
                    <div onClick={() => setActiveModal("vehicles")} style={{ background: "rgba(26, 35, 50, 0.85)", backdropFilter: "blur(10px)", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Active Vehicles</span>
                            <div style={{ background: "#10B981", padding: 4, borderRadius: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-9l-2-2h-4v11h2" /><path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <span style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700 }}>1,248</span>
                            <span style={{ color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600 }}>↗ 12%</span>
                        </div>
                    </div>

                    {/* Total CO2 */}
                    <div onClick={() => setActiveModal("co2")} style={{ background: "rgba(26, 35, 50, 0.85)", backdropFilter: "blur(10px)", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Total CO2 (Today)</span>
                            <div style={{ color: "#10B981", fontSize: "0.75rem", fontWeight: 700 }}>CO₂</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <span style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700 }}>482 <span style={{ fontSize: "1rem", color: "#8b949e", fontWeight: 500 }}>Tons</span></span>
                            <span style={{ color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600 }}>↘ 2.4%</span>
                        </div>
                    </div>

                    {/* Avg Efficiency */}
                    <div onClick={() => setActiveModal("efficiency")} style={{ background: "rgba(26, 35, 50, 0.85)", backdropFilter: "blur(10px)", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Avg Efficiency</span>
                            <div style={{ background: "#10B981", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <span style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700 }}>8.4 <span style={{ fontSize: "1rem", color: "#8b949e", fontWeight: 500 }}>km/L</span></span>
                            <span style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600 }}>↘ 0.8%</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT PANEL: 40% Metrics & Fleet */}
            <div style={{ width: "40%", background: "#0F172A", display: "flex", flexDirection: "column", overflowY: "auto", padding: "32px 40px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

                    {/* Column 1: Performance & Trend */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div>
                            <h2 style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Performance Metrics</h2>

                            {/* On-Time Card */}
                            <div style={{ background: "#1a2332", border: "1px solid #1e293b", borderRadius: 12, padding: "20px", marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                    <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: 8, borderRadius: 8 }}>
                                        <Clock color="#3b82f6" size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: "#8b949e", fontSize: "0.8rem", marginBottom: 2 }}>On-Time Delivery</div>
                                        <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>94.2%</div>
                                        <div style={{ width: "100%", height: 6, background: "#0F172A", borderRadius: 3, overflow: "hidden" }}>
                                            <div style={{ width: "94.2%", height: "100%", background: "#3b82f6", borderRadius: 3 }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fuel Card */}
                            <div style={{ background: "#1a2332", border: "1px solid #1e293b", borderRadius: 12, padding: "20px" }}>
                                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                    <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: 8, borderRadius: 8 }}>
                                        <Fuel color="#f59e0b" size={20} />
                                    </div>
                                    <div>
                                        <div style={{ color: "#8b949e", fontSize: "0.8rem", marginBottom: 2 }}>Fuel Consumption</div>
                                        <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>12,450 L</div>
                                        <div style={{ color: "#f59e0b", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                                            <TriangleAlert size={12} /> High usage in North Zone
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Carbon Emission Trend</h2>
                            <div style={{ background: "#1a2332", border: "1px solid #1e293b", borderRadius: 12, padding: "20px", height: 260, position: "relative" }}>
                                <div style={{ position: "absolute", top: 20, right: 20, display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                                    <span style={{ color: "#8b949e", fontSize: "0.65rem", textTransform: "uppercase" }}>Real-time</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData} margin={{ top: 30, right: 0, bottom: 0, left: 0 }}>
                                        <XAxis dataKey="time" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {trendData.map((d, i) => (
                                                <Cell key={i} fill={i === trendData.length - 1 ? "#10B981" : "rgba(16, 185, 129, 0.4)"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Resolution & Fleet */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h2 style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>Resolution Center</h2>
                                <div style={{ background: "#ef4444", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                                    3
                                </div>
                            </div>

                            <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: "20px" }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                    <TriangleAlert color="#ef4444" size={16} />
                                    <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                                        Delay Risk: Route 4
                                    </span>
                                </div>
                                <p style={{ color: "#8b949e", fontSize: "0.8rem", margin: "0 0 16px", lineHeight: 1.5 }}>
                                    Congestion spike detected near Delhi hub.
                                </p>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>Reroute</button>
                                    <button style={{ background: "transparent", color: "#8b949e", border: "none", fontSize: "0.8rem", cursor: "pointer" }}>Ignore</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Live Fleet</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {vehicles.slice(0, 5).map((v, i) => {
                                    const dotColor = v.status === "NORMAL" && v.eta_status !== "DELAYED" && v.eta_status !== "AT_RISK" ? "#10B981" : v.status === "WARNING" || v.eta_status === "AT_RISK" ? "#f59e0b" : "#ef4444";
                                    return (
                                        <div key={v.vehicle_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: i < 4 ? "1px solid #1e293b" : "none" }}>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
                                                <div>
                                                    <div style={{ color: "#f0f6fc", fontSize: "0.85rem", fontWeight: 600, marginBottom: 2 }}>{v.vehicle_id}</div>
                                                    <div style={{ color: "#4b5563", fontSize: "0.7rem" }}>{v.route_id.replace(/_/g, " ")}</div>
                                                </div>
                                            </div>
                                            <div style={{ color: "#f0f6fc", fontSize: "0.8rem" }}>
                                                {v.speed_kmph?.toFixed(0)} <span style={{ color: "#8b949e", fontSize: "0.7rem" }}>km/h</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Link href="/fleet" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, color: "#10B981", fontSize: "0.8rem", textDecoration: "none", marginTop: 8 }}>
                                View All Fleet <MoveRight size={14} />
                            </Link>
                        </div>

                        {/* Fleet Performance Rankings */}
                        {rankings.length > 0 && (
                            <div>
                                <h2 style={{ color: "#8b949e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Fleet Performance Rankings</h2>
                                <div style={{ background: "#1a2332", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                                    {rankings.slice(0, 5).map((r, i) => (
                                        <div key={r.vehicle_id} style={{
                                            display: "flex", alignItems: "center", padding: "10px 16px",
                                            borderBottom: i < 4 ? "1px solid #1e293b" : "none",
                                        }}>
                                            <span style={{ color: i < 3 ? "#00ff87" : "#f59e0b", fontSize: "0.85rem", fontWeight: 700, width: 24 }}>#{i + 1}</span>
                                            <Link href={`/vehicle/${r.vehicle_id}`} style={{ color: "#f0f6fc", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>{r.vehicle_id}</Link>
                                            <span style={{ color: "#8b949e", fontSize: "0.72rem", marginRight: 12 }}>{r.co2_kg} kg</span>
                                            <span style={{ color: r.score >= 4 ? "#00ff87" : r.score >= 3 ? "#f59e0b" : "#ef4444", fontSize: "0.72rem", fontWeight: 700 }}>{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Carbon Report Link */}
                        <Link href="/carbon-report" style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            background: "#0d1421", border: "1px solid #1e293b", borderRadius: 10,
                            padding: "10px 20px", color: "#00D4FF", fontSize: "0.82rem",
                            fontWeight: 600, textDecoration: "none", marginTop: 8,
                        }}>📊 Export Carbon Report <MoveRight size={14} /></Link>
                    </div>
                </div>
            </div>

            {/* KPI Modals */}
            <MetricModal open={activeModal === "co2"} onClose={() => setActiveModal(null)} title="CO₂ Emissions Today">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ color: "#f0f6fc", fontSize: "2rem", fontWeight: 800 }}>{totalCo2} <span style={{ fontSize: "1rem", color: "#8b949e" }}>kg total</span></div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <XAxis dataKey="time" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Bar dataKey="val" radius={[4, 4, 0, 0]} fill="#10B981" maxBarSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ color: "#8b949e", fontSize: "0.78rem" }}>CO₂ saved today: <strong style={{ color: "#00ff87" }}>{stats.totalSaved?.toFixed(1)} kg</strong></div>
                </div>
            </MetricModal>

            <MetricModal open={activeModal === "vehicles"} onClose={() => setActiveModal(null)} title="Active Vehicles">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ color: "#f0f6fc", fontSize: "2rem", fontWeight: 800 }}>{activeVehiclesCount} <span style={{ fontSize: "1rem", color: "#8b949e" }}>active</span></div>
                    {vehicles.map(v => (
                        <Link key={v.vehicle_id} href={`/vehicle/${v.vehicle_id}`} style={{
                            display: "flex", justifyContent: "space-between", padding: "8px 12px",
                            background: "#111827", borderRadius: 8, color: "#f0f6fc",
                            textDecoration: "none", fontSize: "0.82rem"
                        }}>
                            <span style={{ fontWeight: 600 }}>{v.vehicle_id}</span>
                            <span style={{ color: v.status === "NORMAL" ? "#00ff87" : v.status === "WARNING" ? "#f59e0b" : "#ef4444" }}>{v.status.replace(/_/g, " ")}</span>
                        </Link>
                    ))}
                </div>
            </MetricModal>

            <MetricModal open={activeModal === "efficiency"} onClose={() => setActiveModal(null)} title="Fleet CO₂ Efficiency">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ color: "#f0f6fc", fontSize: "2rem", fontWeight: 800 }}>{avgEff} <span style={{ fontSize: "1rem", color: "#8b949e" }}>km/L avg</span></div>
                    <div style={{ color: "#8b949e", fontSize: "0.82rem" }}>On-time delivery: <strong style={{ color: "#3b82f6" }}>{onTimePct}%</strong></div>
                    <div style={{ color: "#8b949e", fontSize: "0.82rem" }}>Total fuel consumed: <strong style={{ color: "#f59e0b" }}>{totalFuel} L</strong></div>
                    {vehicles.map(v => {
                        const eff = v.fuel_consumed_liters > 0 ? ((v.speed_kmph * (2 / 60)) / v.fuel_consumed_liters).toFixed(2) : "—";
                        return (
                            <div key={v.vehicle_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: "0.82rem" }}>
                                <span style={{ color: "#f0f6fc" }}>{v.vehicle_id}</span>
                                <span style={{ color: "#00D4FF" }}>{eff} km/L</span>
                            </div>
                        );
                    })}
                </div>
            </MetricModal>
        </div>
    );
}
