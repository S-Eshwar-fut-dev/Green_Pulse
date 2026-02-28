"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import type { VehicleEvent } from "@/lib/types";

/* ── Tile: CartoDB Dark Matter (free, no API key) ── */
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/* ── Route definitions ── */
const ROUTES = [
    { id: "all", label: "All Routes" },
    { id: "delhi_mumbai", label: "Delhi → Mumbai (NH48)" },
    { id: "chennai_bangalore", label: "Chennai → Bangalore (NH44)" },
    { id: "kolkata_patna", label: "Kolkata → Patna (NH19)" },
];

const ROUTE_DATA: Record<string, {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    waypoints: [number, number][];
    color: string;
}> = {
    delhi_mumbai: {
        origin: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
        destination: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
        waypoints: [
            [28.6139, 77.2090], [27.4924, 77.6737], [27.1767, 78.0081],
            [26.2183, 78.1828], [23.2599, 77.4126], [22.7196, 76.1320],
            [22.3072, 73.1812], [19.0760, 72.8777],
        ],
        color: "#00D4FF",
    },
    chennai_bangalore: {
        origin: { lat: 13.0827, lng: 80.2707, name: "Chennai" },
        destination: { lat: 12.9716, lng: 77.5946, name: "Bangalore" },
        waypoints: [
            [13.0827, 80.2707], [12.9165, 79.1325],
            [12.5186, 78.2137], [12.9716, 77.5946],
        ],
        color: "#00FF88",
    },
    kolkata_patna: {
        origin: { lat: 22.5726, lng: 88.3639, name: "Kolkata" },
        destination: { lat: 25.5941, lng: 85.1376, name: "Patna" },
        waypoints: [
            [22.5726, 88.3639], [23.6889, 86.9661],
            [24.7914, 84.9994], [25.5941, 85.1376],
        ],
        color: "#FF6B35",
    },
};

/* ── Checkpoints ── */
const CHECKPOINTS = [
    { lat: 26.92, lng: 77.56, label: "Toll — Kota Junction", type: "toll", route: "delhi_mumbai" },
    { lat: 24.58, lng: 77.32, label: "Weigh — Bhopal Bypass", type: "weigh", route: "delhi_mumbai" },
    { lat: 22.72, lng: 75.86, label: "Rest — Indore Stop", type: "rest", route: "delhi_mumbai" },
    { lat: 12.74, lng: 79.04, label: "Toll — Vellore Gate", type: "toll", route: "chennai_bangalore" },
    { lat: 12.52, lng: 78.21, label: "Weigh — Krishnagiri", type: "weigh", route: "chennai_bangalore" },
    { lat: 23.68, lng: 86.97, label: "Toll — Dhanbad Plaza", type: "toll", route: "kolkata_patna" },
    { lat: 24.79, lng: 85.00, label: "Rest — Gaya Stop", type: "rest", route: "kolkata_patna" },
];

function statusColor(status: string): string {
    if (status === "HIGH_EMISSION_ALERT") return "#ef4444";
    if (status === "WARNING") return "#f59e0b";
    return "#00ff87";
}

function checkpointColor(type: string): string {
    if (type === "toll") return "#fbbf24";
    if (type === "rest") return "#3b82f6";
    return "#f97316";
}

interface Props {
    vehicles: VehicleEvent[];
    onVehicleClick?: (id: string) => void;
    selectedVehicleId?: string | null;
    singleRoute?: string;
    singleVehicle?: boolean;
    height?: string;
}

export default function IndiaMap({
    vehicles,
    onVehicleClick,
    selectedVehicleId,
    singleRoute,
    singleVehicle = false,
    height = "100%",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const [activeRoute, setActiveRoute] = useState(singleRoute || "all");

    const visibleRoutes = useMemo(() => {
        if (activeRoute === "all") return Object.keys(ROUTE_DATA);
        return [activeRoute].filter(r => r in ROUTE_DATA);
    }, [activeRoute]);

    const visibleVehicles = useMemo(() => {
        if (activeRoute === "all") return vehicles;
        return vehicles.filter(v => v.route_id === activeRoute);
    }, [vehicles, activeRoute]);

    const visibleCheckpoints = useMemo(() => {
        if (activeRoute === "all") return CHECKPOINTS;
        return CHECKPOINTS.filter(c => c.route === activeRoute);
    }, [activeRoute]);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [22.0, 80.0],
            zoom: singleVehicle ? 7 : 5,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer(TILE_URL).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            layerGroupRef.current = null;
        };
    }, [singleVehicle]);

    // Update markers & routes when data changes
    useEffect(() => {
        const map = mapRef.current;
        const lg = layerGroupRef.current;
        if (!map || !lg) return;

        lg.clearLayers();
        const allBounds: L.LatLng[] = [];

        // Draw route polylines
        for (const routeId of visibleRoutes) {
            const route = ROUTE_DATA[routeId];
            if (!route) continue;

            const latlngs: L.LatLngExpression[] = route.waypoints;
            L.polyline(latlngs, {
                color: route.color,
                weight: 4,
                opacity: 0.7,
            }).addTo(lg);

            // Origin pin
            L.marker([route.origin.lat, route.origin.lng], {
                icon: L.divIcon({
                    className: "",
                    html: `<div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="background:#10B981;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px #10B98155;">${route.origin.name}</div>
                        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #10B981;margin-top:-1px;"></div>
                    </div>`,
                    iconSize: [60, 30],
                    iconAnchor: [30, 30],
                }),
            }).addTo(lg);

            // Destination pin
            L.marker([route.destination.lat, route.destination.lng], {
                icon: L.divIcon({
                    className: "",
                    html: `<div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px #ef444455;">${route.destination.name}</div>
                        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #ef4444;margin-top:-1px;"></div>
                    </div>`,
                    iconSize: [60, 30],
                    iconAnchor: [30, 30],
                }),
            }).addTo(lg);

            allBounds.push(L.latLng(route.origin.lat, route.origin.lng));
            allBounds.push(L.latLng(route.destination.lat, route.destination.lng));
        }

        // Ghost paths for delayed vehicles
        for (const v of visibleVehicles.filter(v => v.eta_status === "DELAYED")) {
            const route = ROUTE_DATA[v.route_id];
            if (!route) continue;
            L.polyline(route.waypoints, {
                color: "#ef4444",
                weight: 2,
                opacity: 0.3,
                dashArray: "8 6",
            }).addTo(lg);
        }

        // Checkpoint markers
        for (const cp of visibleCheckpoints) {
            const color = checkpointColor(cp.type);
            const radius = cp.type === "toll" ? "4px" : "50%";
            const icons: Record<string, string> = { toll: "⬡", weigh: "▲", rest: "🛏" };
            const icon = icons[cp.type] || "▲";

            L.marker([cp.lat, cp.lng], {
                icon: L.divIcon({
                    className: "",
                    html: `<div style="width:20px;height:20px;border-radius:${radius};background:${color};display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;border:2px solid rgba(0,0,0,0.3);box-shadow:0 0 6px ${color}66;">${icon}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                }),
            })
                .bindPopup(`<div style="font-size:0.82rem;"><strong>${cp.label}</strong><br/>Type: ${cp.type}</div>`)
                .addTo(lg);
        }

        // Truck markers
        for (const v of visibleVehicles) {
            const color = statusColor(v.status);
            const isSelected = v.vehicle_id === selectedVehicleId;
            const size = isSelected ? 18 : 14;
            const isAlert = v.status === "HIGH_EMISSION_ALERT";

            const marker = L.marker([v.latitude, v.longitude], {
                icon: L.divIcon({
                    className: "",
                    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 ${isSelected ? 12 : 8}px ${color}${isSelected ? "aa" : "66"};cursor:pointer;"></div>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                }),
            }).addTo(lg);

            marker.bindPopup(`
                <div style="font-size:0.82rem;min-width:160px;">
                    <strong style="font-size:0.9rem;">${v.vehicle_id}</strong>
                    <div style="margin-top:4px;line-height:1.6;">
                        Route: ${v.route_id?.replace(/_/g, " → ") || "N/A"}<br/>
                        Speed: ${v.speed_kmph?.toFixed(1)} km/h<br/>
                        CO₂: ${v.co2_kg?.toFixed(2)} kg<br/>
                        ${v.cargo_type ? `Cargo: ${v.cargo_type}<br/>` : ""}
                        ETA: ${v.eta_hours?.toFixed(1)}h (${v.eta_status})
                        ${isAlert ? `<div style="color:#ef4444;font-weight:700;margin-top:4px;">⚠ HIGH EMISSION ALERT</div>` : ""}
                    </div>
                </div>
            `);

            if (onVehicleClick) {
                marker.on("click", () => onVehicleClick(v.vehicle_id));
            }

            allBounds.push(L.latLng(v.latitude, v.longitude));
        }

        // Fit bounds
        if (allBounds.length > 1) {
            map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
        }
    }, [visibleRoutes, visibleVehicles, visibleCheckpoints, selectedVehicleId, onVehicleClick]);

    return (
        <div style={{ height, width: "100%", borderRadius: 14, overflow: "hidden", position: "relative", background: "#0a0f1a" }}>
            {/* Route Selector */}
            {!singleVehicle && (
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
                    <select
                        value={activeRoute}
                        onChange={e => setActiveRoute(e.target.value)}
                        style={{
                            background: "rgba(13,20,33,0.9)", border: "1px solid #1e293b",
                            borderRadius: 8, padding: "6px 12px", color: "#f0f6fc",
                            fontSize: "0.78rem", outline: "none", cursor: "pointer",
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {ROUTES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
            )}

            {/* Leaflet Map Container */}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

            {/* Legend */}
            {!singleVehicle && (
                <div style={{
                    position: "absolute", bottom: 12, left: 12, zIndex: 1000,
                    background: "rgba(13,20,33,0.85)", backdropFilter: "blur(8px)",
                    border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px",
                    display: "flex", gap: 14, fontSize: "0.68rem",
                }}>
                    {[
                        { color: "#00ff87", label: "Normal" },
                        { color: "#f59e0b", label: "Warning" },
                        { color: "#ef4444", label: "Alert" },
                    ].map(item => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                            <span style={{ color: "#8b949e" }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
