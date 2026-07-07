"""Estimate vehicle speed from a track's ground-point history.

Method: for each track we keep a short history of (timestamp, ground_point).
We take the world-space (metres) displacement over a window of frames and
divide by the elapsed time to get m/s, then convert to km/h and smooth with an
exponential moving average to suppress jitter from detection noise.

A ``LineCrossing`` helper implements the classic two-line method (time between
crossing two lines a known real distance apart) which is robust when the
camera geometry is awkward.
"""

from __future__ import annotations

from typing import Deque, List, Optional, Sequence, Tuple
from collections import deque

import numpy as np

from .calibration import GroundPlane
from .geometry import Track

MS_TO_KMH = 3.6


class SpeedEstimator:
    def __init__(self, ground: GroundPlane, smoothing: float = 0.6, window: int = 5):
        self.ground = ground
        self.smoothing = float(min(max(smoothing, 0.0), 0.99))
        self.window = max(2, int(window))

    def update(self, track: Track) -> Optional[float]:
        """Recompute ``track.speed_kmh`` from its history. Returns km/h or None."""
        hist = track.history
        if len(hist) < 2:
            return track.speed_kmh

        # Use a window of recent samples: earliest vs latest in the window.
        recent = hist[-self.window:]
        (_, t0, p0) = recent[0]
        (_, t1, p1) = recent[-1]
        dt = t1 - t0
        if dt <= 1e-6:
            return track.speed_kmh

        dist_m = self.ground.world_distance(p0, p1)
        inst_kmh = (dist_m / dt) * MS_TO_KMH

        # Reject absurd values (detector id-swaps / teleports) rather than
        # letting them pollute the EMA.
        if inst_kmh > 400.0:
            return track.speed_kmh

        if track.speed_kmh is None:
            smoothed = inst_kmh
        else:
            a = self.smoothing
            smoothed = a * track.speed_kmh + (1.0 - a) * inst_kmh

        track.speed_kmh = smoothed
        return smoothed


class LineCrossing:
    """Two-line speed trap: time between crossing line A and line B.

    ``line_a`` and ``line_b`` are (p1, p2) image segments; ``distance_m`` is the
    real-world distance between them along the direction of travel.
    """

    def __init__(self, line_a, line_b, distance_m: float):
        self.a = line_a
        self.b = line_b
        self.distance_m = float(distance_m)
        self._cross_a: dict = {}  # track_id -> timestamp at line A

    @staticmethod
    def _side(line, pt) -> float:
        (x1, y1), (x2, y2) = line
        return (x2 - x1) * (pt[1] - y1) - (y2 - y1) * (pt[0] - x1)

    def update(self, track_id: int, prev_pt, cur_pt, timestamp: float) -> Optional[float]:
        """Feed a track's previous & current point. Returns km/h when it
        completes the A->B trap, else None."""
        if prev_pt is None:
            return None
        if self._crossed(self.a, prev_pt, cur_pt):
            self._cross_a[track_id] = timestamp
            return None
        if self._crossed(self.b, prev_pt, cur_pt) and track_id in self._cross_a:
            dt = timestamp - self._cross_a.pop(track_id)
            if dt > 1e-6:
                return (self.distance_m / dt) * MS_TO_KMH
        return None

    def _crossed(self, line, prev_pt, cur_pt) -> bool:
        return self._side(line, prev_pt) * self._side(line, cur_pt) < 0
