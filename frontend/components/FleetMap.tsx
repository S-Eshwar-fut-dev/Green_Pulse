"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import type { VehicleEvent } from "@/lib/types";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const ROUTE_WAYPOINTS: Record<string, { points: [number, number][]; color: string }> = {
    delhi_mumbai: {
        points: [
            [28.6139, 77.2090], [27.4924, 77.6737], [27.1767, 78.0081],
            [26.2183, 78.1828], [23.2599, 77.4126], [22.7196, 76.1320],
            [22.3072, 73.1812], [19.0760, 72.8777],
        ],
        color: "#00D4FF",
    },
    chennai_bangalore: {
        points: [
            [13.0827, 80.2707], [12.9165, 79.1325],
            [12.5186, 78.2137], [12.9716, 77.5946],
        ],
        color: "#00FF88",
    },
    kolkata_patna: {
        points: [
            [22.5726, 88.3639], [23.6889, 86.9661],
            [24.7914, 84.9994], [25.5941, 85.1376],
        ],
        color: "#FF6B35",
    },
};

function statusColor(status: string): string {
    if (status === "HIGH_EMISSION_ALERT") return "#ef4444";
    if (status === "WARNING") return "#f59e0b";
    return "#00ff87";
}

export default function FleetMap({ vehicles, height = "100%" }: { vehicles: VehicleEvent[]; height?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [22.0, 80.0],
            zoom: 5,
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
    }, []);

    // Update when vehicles change
    useEffect(() => {
        const map = mapRef.current;
        const lg = layerGroupRef.current;
        if (!map || !lg) return;

        lg.clearLayers();
        const allBounds: L.LatLng[] = [];

        // Route polylines
        for (const [routeId, route] of Object.entries(ROUTE_WAYPOINTS)) {
            L.polyline(route.points, { color: route.color, weight: 3, opacity: 0.5 }).addTo(lg);
        }

        // Truck markers
        for (const v of vehicles) {
            const color = statusColor(v.status);
            const marker = L.marker([v.latitude, v.longitude], {
                icon: L.divIcon({
                    className: "",
                    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${color}66;cursor:pointer;"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                }),
            }).addTo(lg);

            marker.bindPopup(`
                <div style="font-size:0.82rem;min-width:150px;">
                    <strong>${v.vehicle_id}</strong>
                    <div style="margin-top:4px;line-height:1.6;">
                        Route: ${v.route_id?.replace(/_/g, " → ")}<br/>
                        Speed: ${v.speed_kmph?.toFixed(1)} km/h<br/>
                        CO₂: ${v.co2_kg?.toFixed(2)} kg<br/>
                        ETA: ${v.eta_hours?.toFixed(1)}h (${v.eta_status})
                    </div>
                </div>
            `);

            allBounds.push(L.latLng(v.latitude, v.longitude));
        }

        if (allBounds.length > 1) {
            map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
        }
    }, [vehicles]);

    return (
        <div style={{ height, width: "100%", borderRadius: 14, overflow: "hidden", background: "#0a0f1a" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>
    );
}
