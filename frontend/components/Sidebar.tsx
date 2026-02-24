"use client";

import { useState } from "react";
import { postSpike } from "@/lib/api";

interface Props {
    onRouteChange: (route: string) => void;
    onBudgetChange: (budget: number) => void;
    selectedRoute: string;
    budget: number;
}

const ROUTES = ["All", "delhi_mumbai", "chennai_bangalore", "kolkata_patna"];
const SPIKE_VEHICLES = ["TRK-DL-001", "TRK-DL-002", "TRK-DL-003", "TRK-DL-004", "TRK-CH-001", "TRK-CH-002", "TRK-CH-003", "TRK-KL-001", "TRK-KL-002", "TRK-KL-003"];

export default function Sidebar({ onRouteChange, onBudgetChange, selectedRoute, budget }: Props) {
    const [demoActive, setDemoActive] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    async function handleDemoToggle() {
        const next = !demoActive;
        setDemoActive(next);
        if (next) {
            const target = SPIKE_VEHICLES[Math.floor(Math.random() * SPIKE_VEHICLES.length)];
            await postSpike(target);
            setToast(`⚠️ Demo spike sent to ${target}`);
            setTimeout(() => setToast(null), 4000);
        }
    }

    return (
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
            <div>
                <label style={{ color: "#8b949e", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    Fleet / Route Filter
                </label>
                {ROUTES.map((r) => (
                    <button
                        key={r}
                        onClick={() => onRouteChange(r)}
                        style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: selectedRoute === r ? "#00ff8722" : "transparent",
                            border: `1px solid ${selectedRoute === r ? "#00ff8755" : "#30363d"}`,
                            color: selectedRoute === r ? "#00ff87" : "#8b949e",
                            borderRadius: 6,
                            padding: "6px 12px",
                            marginBottom: 4,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                        }}
                    >
                        {r === "All" ? "🌐 All Routes" : r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            <div>
                <label style={{ color: "#8b949e", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    Daily CO₂ Budget: <span style={{ color: "#e6edf3" }}>{budget} kg</span>
                </label>
                <input
                    type="range"
                    min={100}
                    max={5000}
                    step={50}
                    value={budget}
                    onChange={(e) => onBudgetChange(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#00ff87" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", color: "#8b949e", fontSize: "0.68rem", marginTop: 2 }}>
                    <span>100 kg</span><span>5,000 kg</span>
                </div>
            </div>

            <div>
                <label style={{ color: "#8b949e", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    🔴 Demo Mode
                </label>
                <button
                    onClick={handleDemoToggle}
                    style={{
                        width: "100%",
                        background: demoActive ? "#ff444422" : "#21262d",
                        border: `1px solid ${demoActive ? "#ff4444" : "#30363d"}`,
                        color: demoActive ? "#ff4444" : "#8b949e",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                    }}
                >
                    {demoActive ? "🔴 Spike Active" : "Trigger Spike Alert"}
                </button>
                {toast && (
                    <div style={{ marginTop: 8, background: "#ff444422", border: "1px solid #ff4444", borderRadius: 6, padding: "6px 10px", color: "#ff4444", fontSize: "0.72rem" }}>
                        {toast}
                    </div>
                )}
            </div>
        </div>
    );
}
