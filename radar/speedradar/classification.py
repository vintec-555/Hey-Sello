"""Map raw detector labels to normalised Indian vehicle classes.

A COCO-trained YOLO knows: car, motorcycle, bus, truck, bicycle, person.
Indian traffic adds the auto-rickshaw (three-wheeler), which COCO has no class
for. Two paths:

1. If you fine-tune YOLO on an Indian dataset with an explicit
   ``auto``/``autorickshaw`` class, we pass it straight through.
2. Otherwise autos are usually mislabelled ``car`` or ``truck``. We apply a
   cheap geometric heuristic (small, tall-ish, near the camera) to reclassify
   likely autos. It is a hint, not ground truth — the honest fix is a
   fine-tuned model, and the code says so.
"""

from __future__ import annotations

from typing import Optional

from .config import VehicleClass
from .geometry import BBox

# Raw label (lowercased) -> normalised class.
_LABEL_MAP = {
    "car": VehicleClass.CAR,
    "motorcycle": VehicleClass.BIKE,
    "motorbike": VehicleClass.BIKE,
    "bike": VehicleClass.BIKE,
    "bus": VehicleClass.BUS,
    "truck": VehicleClass.TRUCK,
    "lorry": VehicleClass.TRUCK,
    "bicycle": VehicleClass.BICYCLE,
    "cycle": VehicleClass.BICYCLE,
    "person": VehicleClass.PERSON,
    # Custom labels a fine-tuned Indian model might emit:
    "auto": VehicleClass.AUTO,
    "autorickshaw": VehicleClass.AUTO,
    "auto-rickshaw": VehicleClass.AUTO,
    "rickshaw": VehicleClass.AUTO,
    "threewheeler": VehicleClass.AUTO,
    "three-wheeler": VehicleClass.AUTO,
    "tempo": VehicleClass.AUTO,
}

VEHICLE_CLASSES = {
    VehicleClass.CAR,
    VehicleClass.BIKE,
    VehicleClass.BUS,
    VehicleClass.TRUCK,
    VehicleClass.AUTO,
    VehicleClass.BICYCLE,
}


def normalize_label(label: str) -> VehicleClass:
    return _LABEL_MAP.get((label or "").strip().lower(), VehicleClass.UNKNOWN)


def is_vehicle(vc: VehicleClass) -> bool:
    return vc in VEHICLE_CLASSES


def classify(
    label: str,
    bbox: BBox,
    frame_height: int,
    heuristic_auto: bool = True,
) -> VehicleClass:
    """Return the normalised class for a detection.

    ``heuristic_auto`` reclassifies small, near-square, lower-frame ``car``
    detections as autos — a rough stand-in until a proper model is trained.
    """
    vc = normalize_label(label)

    if heuristic_auto and vc == VehicleClass.CAR and frame_height > 0:
        aspect = bbox.width / bbox.height if bbox.height > 0 else 0.0
        near_camera = bbox.y2 > 0.55 * frame_height  # bottom half of frame
        small = bbox.height < 0.28 * frame_height
        boxy = 0.7 <= aspect <= 1.4  # autos are taller/boxier than sedans
        if near_camera and small and boxy:
            return VehicleClass.AUTO

    return vc
