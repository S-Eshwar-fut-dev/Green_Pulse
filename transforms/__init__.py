"""
RouteZero Streaming Transforms Package.

Houses all Pathway UDFs and computation graph components for real-time
CO₂ calculation, ETA prediction, anomaly detection, and window aggregations.

Modules:
    co2_engine: IPCC AR6 WGIII emission factor computation per vehicle.
    eta_engine: ETA prediction with ghost path projections.
    window_aggregations: 5-min tumbling + 30-min sliding window logic.
    alert_logic: HIGH_EMISSION_ALERT threshold detection.
    route_checker: Haversine-based route deviation detection UDF.
"""

__version__ = "2.0.0"
__all__ = [
    "co2_engine",
    "eta_engine",
    "window_aggregations",
    "alert_logic",
    "route_checker",
]
