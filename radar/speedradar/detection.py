"""Vehicle detectors.

`YoloDetector` uses ultralytics YOLO when installed (recommended — accurate,
knows vehicle classes out of the box). If ultralytics or the weights are not
available we fall back to `MotionDetector`, a background-subtraction detector
that finds moving blobs. The blobs have no class, so downstream everything is
treated as an ``unknown`` vehicle — good enough to prove the speed pipeline
end-to-end without a GPU or model download.

`build_detector(config)` picks the right one and never raises just because a
model is missing; it logs what it chose.
"""

from __future__ import annotations

import logging
from typing import List, Optional

import numpy as np

from .config import Config
from .geometry import BBox, Detection

log = logging.getLogger("speedradar.detection")

# COCO ids we care about (car, motorcycle, bus, truck, bicycle, person).
_COCO_KEEP = {1: "bicycle", 2: "car", 3: "motorcycle", 5: "bus", 7: "truck", 0: "person"}


class Detector:
    name = "base"

    def detect(self, frame: np.ndarray) -> List[Detection]:  # pragma: no cover - interface
        raise NotImplementedError


class YoloDetector(Detector):
    name = "yolo"

    def __init__(self, model_path: str, conf: float, device: str = "cpu"):
        from ultralytics import YOLO  # imported lazily; optional dependency

        self.model = YOLO(model_path)
        self.conf = conf
        self.device = device
        # Map this model's own class names, so fine-tuned Indian models
        # (with an `auto` class) work without code changes.
        self.names = getattr(self.model, "names", {}) or {}

    def detect(self, frame: np.ndarray) -> List[Detection]:
        results = self.model.predict(
            frame, conf=self.conf, device=self.device, verbose=False
        )
        out: List[Detection] = []
        for res in results:
            boxes = getattr(res, "boxes", None)
            if boxes is None:
                continue
            names = getattr(res, "names", self.names) or self.names
            for b in boxes:
                cls_id = int(b.cls[0])
                label = names.get(cls_id, _COCO_KEEP.get(cls_id, str(cls_id)))
                score = float(b.conf[0])
                x1, y1, x2, y2 = [float(v) for v in b.xyxy[0]]
                out.append(Detection(BBox(x1, y1, x2, y2), score, label))
        return out


class MotionDetector(Detector):
    """Background-subtraction fallback — no model, no class labels."""

    name = "motion"

    def __init__(self, min_area_frac: float = 0.0015, history: int = 200):
        import cv2

        self.cv2 = cv2
        self.bg = cv2.createBackgroundSubtractorMOG2(
            history=history, varThreshold=40, detectShadows=False
        )
        self.min_area_frac = min_area_frac
        self.kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))

    def detect(self, frame: np.ndarray) -> List[Detection]:
        cv2 = self.cv2
        h, w = frame.shape[:2]
        min_area = self.min_area_frac * (h * w)

        mask = self.bg.apply(frame)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, self.kernel)
        mask = cv2.dilate(mask, self.kernel, iterations=2)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        out: List[Detection] = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < min_area:
                continue
            x, y, bw, bh = cv2.boundingRect(c)
            out.append(Detection(BBox(x, y, x + bw, y + bh), 0.5, "vehicle"))
        return out


def build_detector(config: Config) -> Detector:
    """Choose a detector per config, degrading gracefully."""
    want = (config.detector or "auto").lower()

    if want in ("yolo", "auto"):
        try:
            det = YoloDetector(config.model_path, config.conf_threshold, config.device)
            log.info("Using YOLO detector (%s)", config.model_path)
            return det
        except Exception as exc:  # ImportError, missing weights, etc.
            if want == "yolo":
                raise
            log.warning(
                "YOLO unavailable (%s). Falling back to motion detector. "
                "Install `ultralytics` and provide weights for real detection.",
                exc,
            )

    det = MotionDetector()
    log.info("Using motion (background-subtraction) fallback detector")
    return det
