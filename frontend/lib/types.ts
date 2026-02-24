export interface VehicleEvent {
    vehicle_id: string;
    timestamp: number;
    latitude: number;
    longitude: number;
    fuel_consumed_liters: number;
    speed_kmph: number;
    route_id: string;
    co2_kg: number;
    status: "NORMAL" | "WARNING" | "HIGH_EMISSION_ALERT";
    deviation_status: string;
    co2_saved_kg: number;
}

export interface FleetSummary {
    route_id: string;
    total_co2_kg: number;
    total_fuel_liters: number;
    vehicle_count: number;
}

export interface QueryResult {
    answer: string;
    sources: string[];
    live_data_used: boolean;
}

export interface AnomalyEntry {
    id: string;
    timestamp: number;
    vehicle_id: string;
    type: "HIGH_EMISSION_ALERT" | "ROUTE_DEVIATION_ALERT";
    detail: string;
}

export interface ChartDataPoint {
    time: string;
    [vehicle_id: string]: number | string;
}
