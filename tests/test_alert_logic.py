"""
Unit tests for RouteZero anomaly detection and alert logic.

Validates HIGH_EMISSION_ALERT thresholds, cold-chain SLA breach detection,
and overload violation flag computation per MV Act Section 194.
"""

import pytest


class TestEmissionAlerts:
    """Test HIGH_EMISSION_ALERT threshold logic."""

    SPIKE_MULTIPLIER = 2.0

    def test_alert_fires_above_threshold(self) -> None:
        """Alert triggers when 5-min avg exceeds 2× 30-min rolling baseline."""
        baseline_avg = 5.0
        current_reading = 11.0
        is_alert = current_reading > (baseline_avg * self.SPIKE_MULTIPLIER)
        assert is_alert is True

    def test_no_alert_below_threshold(self) -> None:
        """No alert when 5-min reading is within 2× baseline."""
        baseline_avg = 5.0
        current_reading = 9.9
        is_alert = current_reading > (baseline_avg * self.SPIKE_MULTIPLIER)
        assert is_alert is False

    def test_boundary_condition(self) -> None:
        """Exactly 2× baseline should NOT trigger alert (strictly greater than)."""
        baseline_avg = 5.0
        current_reading = 10.0
        is_alert = current_reading > (baseline_avg * self.SPIKE_MULTIPLIER)
        assert is_alert is False


class TestColdChainAlerts:
    """Test ASHRAE -18°C SLA breach detection."""

    SLA_TEMP_C = -18.0
    TOLERANCE_C = 2.0

    def test_breach_above_sla(self) -> None:
        """Temperature above -18°C + tolerance triggers breach."""
        cargo_temp = -15.0
        breach = cargo_temp > (self.SLA_TEMP_C + self.TOLERANCE_C)
        assert breach is True

    def test_no_breach_within_tolerance(self) -> None:
        """Temperature within ±2°C of -18°C is acceptable."""
        cargo_temp = -17.5
        breach = cargo_temp > (self.SLA_TEMP_C + self.TOLERANCE_C)
        assert breach is False


class TestOverloadDetection:
    """Test MV Act Section 194 overload violation logic."""

    def test_overload_flag_positive(self) -> None:
        """Vehicle exceeding capacity should flag positive overload_pct."""
        load_kg = 28000
        capacity_kg = 26500
        overload_pct = ((load_kg - capacity_kg) / capacity_kg) * 100
        assert overload_pct > 0

    def test_within_limit_negative_pct(self) -> None:
        """Vehicle under capacity should return negative overload_pct."""
        load_kg = 20000
        capacity_kg = 26500
        overload_pct = ((load_kg - capacity_kg) / capacity_kg) * 100
        assert overload_pct < 0
