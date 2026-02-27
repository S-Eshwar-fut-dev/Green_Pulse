"""
RouteZero Data Connectors Package.

Provides Pathway ConnectorSubject implementations for ingesting
real-time GPS telemetry and order streams from Indian freight corridors.

Modules:
    gps_fuel_stream: GPS + OBD-II telemetry connector for 10-truck fleet.
    telemetry_source: Pathway streaming source for vehicle telemetry.
    order_source: Order management stream connector.
"""

from connectors.gps_fuel_stream import TruckTelemetrySource, build_telemetry_table

__all__ = ["TruckTelemetrySource", "build_telemetry_table"]
__version__ = "2.0.0"
