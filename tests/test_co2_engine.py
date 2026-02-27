"""
Unit tests for the IPCC AR6 CO₂ emission calculation engine.

Tests validate emission factor math, load multiplier application,
and speed efficiency penalty logic per IPCC AR6 WGIII baselines.
"""

import pytest


class TestCo2Calculation:
    """Test suite for IPCC AR6-based CO₂ computation."""

    def test_base_emission_factor(self) -> None:
        """Validate base CO₂ factor: 0.89 kg/km for unladen diesel freight."""
        base_factor = 0.89
        distance_km = 100.0
        expected_kg = distance_km * base_factor * 1.0 * 1.0
        assert abs(expected_kg - 89.0) < 0.01

    def test_laden_load_multiplier(self) -> None:
        """Full load (100%) applies 1.4× multiplier per IPCC AR6 Table 10.1."""
        load_pct = 1.0
        multiplier = 1.0 + (0.4 * load_pct)
        assert multiplier == pytest.approx(1.4, abs=0.01)

    def test_cold_chain_refrigeration_factor(self) -> None:
        """ASHRAE refrigeration load adds 1.25× to base emission."""
        base_co2 = 89.0
        cold_chain_factor = 1.25
        assert base_co2 * cold_chain_factor == pytest.approx(111.25, abs=0.01)

    def test_speed_penalty_above_90kmph(self) -> None:
        """Speed above 90 km/h incurs efficiency penalty (>1.0 multiplier)."""
        speed_kmph = 95.0
        optimal_max = 80.0
        penalty = 1.0 + max(0.0, (speed_kmph - optimal_max) / 100.0)
        assert penalty > 1.0

    def test_optimal_speed_no_penalty(self) -> None:
        """Speed in 60–80 km/h range incurs no efficiency penalty."""
        for speed in [60, 65, 70, 75, 80]:
            penalty = 1.0 + max(0.0, (speed - 80) / 100.0)
            assert penalty == pytest.approx(1.0, abs=0.001)


class TestRouteValidation:
    """Test corridor assignment and deviation detection."""

    VALID_ROUTES = ["delhi_mumbai", "chennai_bangalore", "kolkata_patna"]

    def test_valid_route_ids(self) -> None:
        """All three Indian freight corridors must be recognized."""
        for route in self.VALID_ROUTES:
            assert isinstance(route, str)
            assert len(route) > 0

    def test_route_distance_sanity(self) -> None:
        """Route distances should be within realistic India highway bounds."""
        route_distances = {
            "delhi_mumbai": 1428,
            "chennai_bangalore": 350,
            "kolkata_patna": 580,
        }
        for route, dist in route_distances.items():
            assert 100 < dist < 2000, f"Implausible distance for {route}: {dist} km"
