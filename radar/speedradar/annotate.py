"""Draw boxes, speeds, plates and the calibration polygon on frames."""

from __future__ import annotations

from typing import Optional

import numpy as np


_CLASS_COLORS = {
    "car": (0, 200, 0),
    "bike": (0, 180, 255),
    "auto": (255, 180, 0),
    "bus": (200, 0, 200),
    "truck": (140, 60, 220),
    "bicycle": (0, 255, 255),
    "unknown": (180, 180, 180),
}


def _color(vehicle_class: Optional[str], flagged: bool):
    if flagged:
        return (0, 0, 255)  # red for violations (BGR)
    return _CLASS_COLORS.get(vehicle_class or "unknown", (180, 180, 180))


def draw_tracks(frame: np.ndarray, tracks, config) -> np.ndarray:
    import cv2

    for tr in tracks:
        if tr.misses > 0:
            continue
        x1, y1, x2, y2 = tr.bbox.as_int_tuple()
        color = _color(tr.vehicle_class, tr.flagged)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        label = tr.vehicle_class or "…"
        if tr.speed_kmh is not None:
            limit = config.limit_for(tr.vehicle_class or "unknown")
            label += f" {tr.speed_kmh:.0f}km/h"
            if tr.flagged:
                label += f" >{limit:.0f}"
        if tr.plate_text:
            label += f" [{tr.plate_text}]"

        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 4, y1), color, -1)
        cv2.putText(frame, label, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
    return frame


def draw_calibration(frame: np.ndarray, image_points) -> np.ndarray:
    import cv2

    if not image_points:
        return frame
    pts = np.asarray(image_points, dtype=np.int32).reshape(-1, 1, 2)
    cv2.polylines(frame, [pts], isClosed=True, color=(255, 255, 0), thickness=1)
    return frame


def draw_hud(frame: np.ndarray, text: str) -> np.ndarray:
    import cv2

    cv2.rectangle(frame, (0, 0), (frame.shape[1], 26), (0, 0, 0), -1)
    cv2.putText(frame, text, (8, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                (255, 255, 255), 1, cv2.LINE_AA)
    return frame
