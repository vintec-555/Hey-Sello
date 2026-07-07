"""SpeedRadar — AI speed-radar & ANPR for Indian traffic.

Detects and tracks vehicles (car, motorcycle/bike, bus, truck, auto-rickshaw,
bicycle) in a video stream, estimates each vehicle's speed from a calibrated
road plane, reads the number plate, and logs anything over the speed limit.

The heavy models (YOLO detection, OCR) are optional and pluggable: if they are
not installed the pipeline degrades gracefully to a motion-based detector and
skips plate text, so the package always runs.
"""

from .config import Config, VehicleClass, DEFAULT_SPEED_LIMITS_KMH
from .geometry import BBox, Track, Detection

__all__ = [
    "Config",
    "VehicleClass",
    "DEFAULT_SPEED_LIMITS_KMH",
    "BBox",
    "Track",
    "Detection",
]

__version__ = "0.1.0"
