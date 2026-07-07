"""The end-to-end speed-radar pipeline.

For every frame:  detect -> track -> classify -> estimate speed ->
(if speeding) read plate + log violation -> annotate.

Designed to run on a video file, an RTSP camera URL, or a webcam index, and to
work whether or not YOLO/OCR are installed.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np

from .annotate import draw_calibration, draw_hud, draw_tracks
from .calibration import GroundPlane
from .classification import classify, is_vehicle
from .config import Config, VehicleClass
from .detection import build_detector
from .plates import build_reader, locate_plate_region
from .speed import SpeedEstimator
from .tracking import IOUTracker
from .violations import ViolationLogger

log = logging.getLogger("speedradar.pipeline")


@dataclass
class RunStats:
    frames: int = 0
    tracks_seen: int = 0
    violations: int = 0
    elapsed_s: float = 0.0

    @property
    def processing_fps(self) -> float:
        return self.frames / self.elapsed_s if self.elapsed_s > 0 else 0.0


class SpeedRadar:
    def __init__(self, config: Config):
        self.config = config
        self.ground = GroundPlane.from_config(config.calibration)
        if getattr(self.ground, "uncalibrated", False):
            log.warning(
                "No calibration provided — speeds are in pixel units, NOT km/h. "
                "Add calibration.image_points + world_points to the config."
            )
        self.detector = build_detector(config)
        self.tracker = IOUTracker(config.iou_match_threshold, config.max_misses)
        self.speed = SpeedEstimator(self.ground, config.speed_smoothing)
        self.reader = build_reader(config.anpr)
        self.logger = ViolationLogger(config.violations_dir, config.save_snapshots)
        self.stats = RunStats()

    # -- per-frame ---------------------------------------------------------

    def process_frame(self, frame: np.ndarray, frame_idx: int, timestamp_s: float):
        h = frame.shape[0]
        detections = self.detector.detect(frame)
        tracks = self.tracker.update(detections, frame_idx, timestamp_s)

        for tr in tracks:
            if tr.misses > 0:
                continue
            # Classify (uses the freshest bbox + label).
            vc = classify(tr.label, tr.bbox, h)
            tr.vehicle_class = vc.value

            # Only estimate speed for actual vehicles with enough history.
            if is_vehicle(vc) or vc == VehicleClass.UNKNOWN:
                if tr.hits >= self.config.min_hits_before_speed:
                    self.speed.update(tr)
                    self._maybe_flag(tr, frame, frame_idx, timestamp_s)

        return tracks

    def _maybe_flag(self, tr, frame, frame_idx, timestamp_s):
        if tr.speed_kmh is None or self.logger.already_logged(tr.track_id):
            return
        if getattr(self.ground, "uncalibrated", False):
            return  # never flag when speeds aren't real km/h

        limit = self.config.limit_for(tr.vehicle_class or "unknown")
        if tr.speed_kmh <= limit + self.config.speed_tolerance_kmh:
            return

        # Speeding — read the plate (once), then log.
        if self.reader.available() and not tr.plate_text:
            self._read_plate(tr, frame)

        self.logger.record(tr, timestamp_s, frame_idx, limit, frame=frame)
        self.stats.violations += 1
        log.info(
            "VIOLATION track=%d %s %.0f km/h (limit %.0f) plate=%s",
            tr.track_id, tr.vehicle_class, tr.speed_kmh, limit, tr.plate_text or "?",
        )

    def _read_plate(self, tr, frame):
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = tr.bbox.as_int_tuple()
        x1 = max(0, x1); y1 = max(0, y1); x2 = min(w, x2); y2 = min(h, y2)
        crop = frame[y1:y2, x1:x2]
        band = locate_plate_region(crop)
        if band is None:
            return
        text, score = self.reader.read(band)
        if text and score > tr.plate_score:
            tr.plate_text = text
            tr.plate_score = score

    # -- driving a video ---------------------------------------------------

    def run(self, progress_every: int = 0) -> RunStats:
        import cv2

        cap = _open_source(self.config.source, cv2)
        fps = self.config.fps_override or cap.get(cv2.CAP_PROP_FPS) or 25.0
        if fps <= 0:
            fps = 25.0

        writer = None
        started = time.monotonic()
        frame_idx = 0
        seen_ids: set = set()

        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                timestamp_s = frame_idx / fps
                tracks = self.process_frame(frame, frame_idx, timestamp_s)
                for t in tracks:
                    seen_ids.add(t.track_id)

                if self.config.draw:
                    draw_calibration(frame, self.config.calibration.image_points)
                    draw_tracks(frame, tracks, self.config)
                    draw_hud(
                        frame,
                        f"SpeedRadar | det:{self.detector.name} | frame {frame_idx} | "
                        f"violations {self.logger.count}",
                    )

                if self.config.output:
                    if writer is None:
                        h, w = frame.shape[:2]
                        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                        writer = cv2.VideoWriter(self.config.output, fourcc, fps, (w, h))
                    writer.write(frame)

                frame_idx += 1
                if progress_every and frame_idx % progress_every == 0:
                    log.info("… %d frames, %d violations", frame_idx, self.logger.count)
        finally:
            cap.release()
            if writer is not None:
                writer.release()

        self.stats.frames = frame_idx
        self.stats.tracks_seen = len(seen_ids)
        self.stats.violations = self.logger.count
        self.stats.elapsed_s = time.monotonic() - started
        return self.stats


def _open_source(source: str, cv2):
    # Numeric string -> webcam index; otherwise treat as path / url.
    src = source
    if isinstance(source, str) and source.isdigit():
        src = int(source)
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source!r}")
    return cap
