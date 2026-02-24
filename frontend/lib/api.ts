import type { QueryResult, VehicleEvent } from "./types";

const BASE = "";

export async function fetchFleet(): Promise<VehicleEvent[]> {
    const res = await fetch(`${BASE}/api/fleet`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

export async function postQuery(question: string): Promise<QueryResult> {
    const res = await fetch(`${BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Query failed");
    return res.json();
}

export async function postSpike(vehicle_id: string): Promise<void> {
    await fetch(`${BASE}/api/spike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id }),
    });
}
