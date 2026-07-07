"""Map image pixels to real-world metres on the road plane.

Two modes:

* Homography (recommended): from 4+ correspondences between pixel points and
  their real-world (metres) coordinates on the flat road, we solve a 3x3
  homography H. This corrects for perspective — a car far up the road moving
  10px is much faster than one near the camera moving 10px.

* Scalar: a single metres-per-pixel factor. Only reasonable for a roughly
  top-down camera, but useful for quick tests.

The homography solver is a self-contained DLT implementation (numpy only) so
it works without OpenCV.
"""

from __future__ import annotations

from typing import List, Optional, Sequence, Tuple

import numpy as np

from .config import CalibrationConfig


def _dlt_homography(src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    """Direct Linear Transform homography src -> dst (both Nx2, N>=4)."""
    assert src.shape[0] >= 4 and src.shape == dst.shape
    A: List[List[float]] = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
        A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
    _, _, vh = np.linalg.svd(np.asarray(A, dtype=np.float64))
    h = vh[-1].reshape(3, 3)
    if abs(h[2, 2]) > 1e-12:
        h = h / h[2, 2]
    return h


class GroundPlane:
    """Transforms image points to world metres."""

    def __init__(self, homography: Optional[np.ndarray] = None, meters_per_pixel: Optional[float] = None):
        self.H = homography
        self.mpp = meters_per_pixel
        if self.H is None and self.mpp is None:
            # Identity fallback: 1 pixel == 1 metre. Speeds will be nonsense but
            # the pipeline still runs; the CLI warns loudly when this happens.
            self.mpp = 1.0
            self.uncalibrated = True
        else:
            self.uncalibrated = False

    @classmethod
    def from_config(cls, cal: CalibrationConfig) -> "GroundPlane":
        if cal.is_homography():
            src = np.asarray(cal.image_points, dtype=np.float64)
            dst = np.asarray(cal.world_points, dtype=np.float64)
            return cls(homography=_dlt_homography(src, dst))
        if cal.meters_per_pixel:
            return cls(meters_per_pixel=float(cal.meters_per_pixel))
        return cls()  # uncalibrated identity

    def to_world(self, point: Sequence[float]) -> Tuple[float, float]:
        """Map one image point (x,y) -> world (X,Y) in metres."""
        x, y = float(point[0]), float(point[1])
        if self.H is not None:
            v = self.H @ np.array([x, y, 1.0])
            w = v[2] if abs(v[2]) > 1e-12 else 1e-12
            return (v[0] / w, v[1] / w)
        return (x * self.mpp, y * self.mpp)

    def world_distance(self, p_img: Sequence[float], q_img: Sequence[float]) -> float:
        """Euclidean distance in metres between two image points."""
        px, py = self.to_world(p_img)
        qx, qy = self.to_world(q_img)
        return float(np.hypot(px - qx, py - qy))
