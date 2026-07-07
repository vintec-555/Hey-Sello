"""Lightweight geometry primitives shared across the pipeline.

Pure-python / numpy only so the maths can be unit-tested without OpenCV,
YOLO or OCR installed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class BBox:
    """Axis-aligned bounding box in pixel coordinates (x1,y1) top-left."""

    x1: float
    y1: float
    x2: float
    y2: float

    def __post_init__(self) -> None:
        # Normalise so x1<=x2, y1<=y2 regardless of how it was constructed.
        if self.x1 > self.x2:
            self.x1, self.x2 = self.x2, self.x1
        if self.y1 > self.y2:
            self.y1, self.y2 = self.y2, self.y1

    @property
    def width(self) -> float:
        return self.x2 - self.x1

    @property
    def height(self) -> float:
        return self.y2 - self.y1

    @property
    def area(self) -> float:
        return max(0.0, self.width) * max(0.0, self.height)

    @property
    def center(self) -> Tuple[float, float]:
        return ((self.x1 + self.x2) / 2.0, (self.y1 + self.y2) / 2.0)

    @property
    def ground_point(self) -> Tuple[float, float]:
        """Point used for speed calc: mid-point of the bottom edge.

        The bottom edge is where the vehicle meets the road plane, so it maps
        most accurately through the ground-plane homography.
        """
        return ((self.x1 + self.x2) / 2.0, self.y2)

    def iou(self, other: "BBox") -> float:
        ix1 = max(self.x1, other.x1)
        iy1 = max(self.y1, other.y1)
        ix2 = min(self.x2, other.x2)
        iy2 = min(self.y2, other.y2)
        iw = max(0.0, ix2 - ix1)
        ih = max(0.0, iy2 - iy1)
        inter = iw * ih
        union = self.area + other.area - inter
        return inter / union if union > 0 else 0.0

    def as_int_tuple(self) -> Tuple[int, int, int, int]:
        return (int(self.x1), int(self.y1), int(self.x2), int(self.y2))


@dataclass
class Detection:
    """A single-frame detection produced by a Detector."""

    bbox: BBox
    score: float
    label: str  # raw detector label, e.g. a COCO class name


@dataclass
class Track:
    """A vehicle followed across frames.

    Holds just enough history for speed estimation and plate sampling; the
    heavy per-frame image data is never retained here.
    """

    track_id: int
    bbox: BBox
    label: str
    score: float
    # history of (frame_index, timestamp_seconds, ground_point_xy)
    history: List[Tuple[int, float, Tuple[float, float]]] = field(default_factory=list)
    misses: int = 0  # consecutive frames the tracker failed to match this track
    hits: int = 1

    vehicle_class: Optional[str] = None
    speed_kmh: Optional[float] = None
    plate_text: Optional[str] = None
    plate_score: float = 0.0
    flagged: bool = False  # already logged as a violation

    @property
    def age(self) -> int:
        return self.hits + self.misses
