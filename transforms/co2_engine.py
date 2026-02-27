"""
IPCC AR6 CO₂ Emission Calculation Engine.

Implements the IPCC AR6 Working Group III (2022) emission factor model
for heavy road freight in Indian logistics corridors.

Emission Formula:
    co2_kg = distance_km × base_factor × load_multiplier × speed_efficiency_factor

Constants:
    BASE_FACTOR_KG_PER_KM: 0.89 kg CO₂/km (heavy diesel freight, IPCC AR6 Table 10.1)
    COLD_CHAIN_FACTOR: 1.25× for refrigerated cargo (ASHRAE Standard 62.1)
    OPTIMAL_SPEED_MAX_KMPH: 80 km/h (efficiency peak for 14-wheel trucks)

References:
    - IPCC AR6 WGIII Chapter 10: Transport (2022)
    - BEE India Carbon Market Guidelines 2024
    - India NLP 2022 Annex C: Freight Emission Baselines
"""

import logging

import pathway as pw

logger = logging.getLogger(__name__)

# ── IPCC AR6 WGIII constants ──────────────────────────────────────────────────
BASE_FACTOR_KG_PER_KM: float = 0.89
"""Base CO₂ emission factor: 0.89 kg/km for heavy diesel road freight (IPCC AR6 Table 10.1)."""

COLD_CHAIN_REFRIGERATION_FACTOR: float = 1.25
"""Additional multiplier for refrigerated cargo per ASHRAE Standard 62.1."""

OPTIMAL_SPEED_MIN_KMPH: float = 60.0
"""Lower bound of fuel-optimal speed range for heavy freight (km/h)."""

OPTIMAL_SPEED_MAX_KMPH: float = 80.0
"""Upper bound of fuel-optimal speed range for heavy freight (km/h)."""

SPEED_PENALTY_RATE: float = 0.01
"""CO₂ penalty rate per km/h above optimal maximum (1% per km/h overspeed)."""


def compute_load_multiplier(load_fraction: float) -> float:
    """
    Compute payload load multiplier using IPCC AR6 linear load model.

    A fully unladen vehicle (load_fraction=0.0) applies 1.0×. A fully laden
    vehicle (load_fraction=1.0) applies 1.4×, reflecting the non-linear
    relationship between payload mass and fuel consumption.

    Args:
        load_fraction: Payload as a fraction of maximum capacity [0.0–1.0].
                       Values above 1.0 indicate overloading.

    Returns:
        float: Load multiplier in range [1.0, 1.4+]. Values >1.4 indicate overload.

    Raises:
        ValueError: If load_fraction is negative.

    Example:
        >>> compute_load_multiplier(1.0)
        1.4
        >>> compute_load_multiplier(0.0)
        1.0
    """
    if load_fraction < 0:
        raise ValueError(f"load_fraction must be non-negative, got {load_fraction}")
    return 1.0 + (0.4 * load_fraction)


def compute_speed_efficiency_factor(speed_kmph: float) -> float:
    """
    Compute speed-based fuel efficiency multiplier.

    Optimal efficiency occurs between 60–80 km/h for heavy freight trucks.
    Above 80 km/h, aerodynamic drag increases fuel burn non-linearly;
    this model applies a 1% penalty per km/h overspeed as a linear approximation.

    Args:
        speed_kmph: Current vehicle speed in km/h. Must be non-negative.

    Returns:
        float: Efficiency multiplier ≥ 1.0. Higher values indicate worse efficiency.

    Example:
        >>> compute_speed_efficiency_factor(70.0)
        1.0
        >>> compute_speed_efficiency_factor(90.0)
        1.1
    """
    if speed_kmph <= OPTIMAL_SPEED_MAX_KMPH:
        return 1.0
    overspeed = speed_kmph - OPTIMAL_SPEED_MAX_KMPH
    return 1.0 + (overspeed * SPEED_PENALTY_RATE)


@pw.udf
def calculate_co2_kg(
    distance_km: float,
    load_kg: float,
    capacity_kg: float,
    speed_kmph: float,
    is_cold_chain: bool,
) -> float:
    """
    Pathway UDF: compute per-event CO₂ emission in kilograms.

    Applies the full IPCC AR6 WGIII emission model including load adjustment,
    speed efficiency penalty, and optional refrigeration overhead for cold-chain cargo.

    Args:
        distance_km: Distance travelled in this telemetry event (km).
        load_kg: Current gross payload weight (kg).
        capacity_kg: Maximum rated vehicle capacity (kg).
        speed_kmph: GPS-derived current speed (km/h).
        is_cold_chain: True if vehicle carries temperature-controlled cargo.

    Returns:
        float: Estimated CO₂ emission for this telemetry event (kg).
               Returns 0.0 on computation errors to avoid pipeline interruption.

    References:
        IPCC AR6 WGIII (2022), Table 10.1 — Road freight emission factors.
    """
    try:
        load_fraction = min(load_kg / max(capacity_kg, 1.0), 2.0)
        load_multiplier = compute_load_multiplier(load_fraction)
        speed_factor = compute_speed_efficiency_factor(speed_kmph)
        cold_factor = COLD_CHAIN_REFRIGERATION_FACTOR if is_cold_chain else 1.0

        co2_kg = distance_km * BASE_FACTOR_KG_PER_KM * load_multiplier * speed_factor * cold_factor
        return round(co2_kg, 3)
    except Exception as exc:
        logger.error(f"CO₂ calculation failed: {exc}", exc_info=True)
        return 0.0
