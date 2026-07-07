"""Configuration model and loading.

Config is plain dataclasses so it can be built in code or loaded from JSON
(or YAML if pyyaml is installed). Speed limits are keyed by the normalised
Indian vehicle class, matching how limits actually differ on Indian roads
(bikes/autos are typically capped lower than cars on the same stretch).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple


class VehicleClass(str, Enum):
    CAR = "car"
    BIKE = "bike"           # motorcycle / two-wheeler
    BUS = "bus"
    TRUCK = "truck"
    AUTO = "auto"           # auto-rickshaw (three-wheeler)
    BICYCLE = "bicycle"
    PERSON = "person"
    UNKNOWN = "unknown"


# Sensible defaults (km/h). Override per-deployment in the config file.
DEFAULT_SPEED_LIMITS_KMH: Dict[str, float] = {
    VehicleClass.CAR.value: 60.0,
    VehicleClass.BIKE.value: 50.0,
    VehicleClass.AUTO.value: 40.0,
    VehicleClass.BUS.value: 50.0,
    VehicleClass.TRUCK.value: 50.0,
    VehicleClass.BICYCLE.value: 25.0,
    VehicleClass.UNKNOWN.value: 60.0,
}


@dataclass
class CalibrationConfig:
    """Ground-plane calibration.

    `image_points` are 4+ pixel coordinates of a flat road patch, and
    `world_points` are their real-world coordinates in metres (same order).
    A homography maps image -> world so pixel motion becomes metres.

    If `world_points` is omitted you can instead give `meters_per_pixel` for a
    crude scalar approximation (only valid for near-top-down cameras).
    """

    image_points: List[Tuple[float, float]] = field(default_factory=list)
    world_points: List[Tuple[float, float]] = field(default_factory=list)
    meters_per_pixel: Optional[float] = None

    def is_homography(self) -> bool:
        return len(self.image_points) >= 4 and len(self.world_points) >= 4


@dataclass
class Config:
    # I/O
    source: str = "0"                 # video path, RTSP url, or webcam index as string
    output: Optional[str] = None      # annotated video output path
    violations_dir: str = "violations"

    # Detection
    detector: str = "auto"            # auto | yolo | motion
    model_path: str = "yolov8n.pt"    # ultralytics weights (auto-downloaded by ultralytics)
    conf_threshold: float = 0.35
    device: str = "cpu"               # cpu | 0 | cuda:0 ...

    # Tracking
    iou_match_threshold: float = 0.3
    max_misses: int = 15              # frames a track survives without a match
    min_hits_before_speed: int = 3    # need this many observations before trusting speed

    # Speed
    calibration: CalibrationConfig = field(default_factory=CalibrationConfig)
    speed_smoothing: float = 0.6      # EMA factor for reported speed (0..1)
    fps_override: Optional[float] = None  # if the container reports a wrong fps

    # Enforcement
    speed_limits_kmh: Dict[str, float] = field(default_factory=lambda: dict(DEFAULT_SPEED_LIMITS_KMH))
    speed_tolerance_kmh: float = 5.0  # grace margin before flagging

    # Plates / ANPR
    anpr: str = "auto"                # auto | easyocr | tesseract | off
    read_plate_on_flag_only: bool = True  # only OCR vehicles that are speeding (saves cpu)

    # Output / display
    save_snapshots: bool = True
    draw: bool = True

    def limit_for(self, vehicle_class: str) -> float:
        return self.speed_limits_kmh.get(
            vehicle_class, self.speed_limits_kmh.get(VehicleClass.UNKNOWN.value, 60.0)
        )

    # ---- loading ---------------------------------------------------------

    @classmethod
    def from_dict(cls, data: dict) -> "Config":
        data = dict(data or {})
        cal = data.pop("calibration", None)
        cfg = cls()
        for key, value in data.items():
            if hasattr(cfg, key):
                setattr(cfg, key, value)
        if cal:
            cfg.calibration = CalibrationConfig(
                image_points=[tuple(p) for p in cal.get("image_points", [])],
                world_points=[tuple(p) for p in cal.get("world_points", [])],
                meters_per_pixel=cal.get("meters_per_pixel"),
            )
        # Merge (not replace) speed limits so partial overrides keep defaults.
        merged = dict(DEFAULT_SPEED_LIMITS_KMH)
        merged.update(cfg.speed_limits_kmh or {})
        cfg.speed_limits_kmh = merged
        return cfg

    @classmethod
    def load(cls, path: str) -> "Config":
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if path.endswith((".yaml", ".yml")):
            try:
                import yaml  # type: ignore
            except ImportError as exc:  # pragma: no cover - depends on env
                raise RuntimeError(
                    "PyYAML is not installed; use a .json config or `pip install pyyaml`."
                ) from exc
            data = yaml.safe_load(text)
        else:
            data = json.loads(text)
        return cls.from_dict(data)

    @classmethod
    def resolve(cls, path: Optional[str]) -> "Config":
        """Load from path if given and it exists, else return defaults."""
        if path and os.path.exists(path):
            return cls.load(path)
        return cls()
