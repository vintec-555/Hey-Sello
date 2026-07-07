"""Record speeding violations.

Each violation is appended to a JSONL log (and a CSV mirror for spreadsheets),
optionally with a cropped snapshot of the offending vehicle saved to disk.
A short in-memory cache prevents logging the same track more than once.
"""

from __future__ import annotations

import csv
import json
import os
from dataclasses import asdict, dataclass
from typing import Optional

import numpy as np


@dataclass
class Violation:
    track_id: int
    timestamp_s: float
    frame_index: int
    vehicle_class: str
    speed_kmh: float
    speed_limit_kmh: float
    over_by_kmh: float
    plate_text: Optional[str]
    plate_confidence: float
    snapshot_path: Optional[str]


_CSV_FIELDS = [
    "track_id", "timestamp_s", "frame_index", "vehicle_class",
    "speed_kmh", "speed_limit_kmh", "over_by_kmh",
    "plate_text", "plate_confidence", "snapshot_path",
]


class ViolationLogger:
    def __init__(self, out_dir: str, save_snapshots: bool = True):
        self.out_dir = out_dir
        self.snap_dir = os.path.join(out_dir, "snapshots")
        self.save_snapshots = save_snapshots
        os.makedirs(out_dir, exist_ok=True)
        if save_snapshots:
            os.makedirs(self.snap_dir, exist_ok=True)
        self.jsonl_path = os.path.join(out_dir, "violations.jsonl")
        self.csv_path = os.path.join(out_dir, "violations.csv")
        self._logged_tracks: set = set()
        self.count = 0
        self._ensure_csv_header()

    def _ensure_csv_header(self) -> None:
        if not os.path.exists(self.csv_path):
            with open(self.csv_path, "w", newline="", encoding="utf-8") as fh:
                csv.DictWriter(fh, fieldnames=_CSV_FIELDS).writeheader()

    def already_logged(self, track_id: int) -> bool:
        return track_id in self._logged_tracks

    def _save_snapshot(self, frame: np.ndarray, bbox, track_id: int, frame_index: int) -> Optional[str]:
        if not self.save_snapshots or frame is None:
            return None
        try:
            import cv2
        except Exception:
            return None
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = bbox.as_int_tuple()
        pad = 6
        x1 = max(0, x1 - pad); y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad); y2 = min(h, y2 + pad)
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return None
        fname = f"track{track_id:04d}_f{frame_index:06d}.jpg"
        path = os.path.join(self.snap_dir, fname)
        cv2.imwrite(path, crop)
        return path

    def record(
        self,
        track,
        timestamp_s: float,
        frame_index: int,
        speed_limit_kmh: float,
        frame: Optional[np.ndarray] = None,
    ) -> Optional[Violation]:
        if self.already_logged(track.track_id):
            return None

        snapshot = self._save_snapshot(frame, track.bbox, track.track_id, frame_index) if frame is not None else None

        v = Violation(
            track_id=track.track_id,
            timestamp_s=round(timestamp_s, 3),
            frame_index=frame_index,
            vehicle_class=track.vehicle_class or "unknown",
            speed_kmh=round(float(track.speed_kmh or 0.0), 1),
            speed_limit_kmh=round(float(speed_limit_kmh), 1),
            over_by_kmh=round(float((track.speed_kmh or 0.0) - speed_limit_kmh), 1),
            plate_text=track.plate_text,
            plate_confidence=round(float(track.plate_score), 3),
            snapshot_path=snapshot,
        )

        with open(self.jsonl_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(asdict(v)) + "\n")
        with open(self.csv_path, "a", newline="", encoding="utf-8") as fh:
            csv.DictWriter(fh, fieldnames=_CSV_FIELDS).writerow(asdict(v))

        self._logged_tracks.add(track.track_id)
        track.flagged = True
        self.count += 1
        return v
