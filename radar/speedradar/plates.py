"""Indian number-plate reading (ANPR).

Two layers:

* Validation/normalisation (pure python, always available): clean OCR output
  and check it against Indian plate formats — the standard state series
  (e.g. ``MH12AB1234``) and the newer Bharat/BH series (e.g. ``22BH1234AA``).
  OCR frequently confuses O/0, I/1, etc.; we correct these positionally using
  the known letter/digit layout of a plate.

* OCR engine (optional): EasyOCR or Tesseract read text from the plate crop.
  If neither is installed, `read()` returns None and the pipeline still logs
  the violation with speed + snapshot, just without plate text.
"""

from __future__ import annotations

import logging
import re
from typing import List, Optional, Tuple

import numpy as np

log = logging.getLogger("speedradar.plates")

# Standard: 2 letters (state) + 1-2 digits (RTO) + 1-3 letters (series) + 4 digits.
_STD_RE = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$")
# BH (Bharat) series: 2 digits (year) + 'BH' + 4 digits + 1-2 letters.
_BH_RE = re.compile(r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$")

_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HR",
    "HP", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ",
    "NL", "OD", "OR", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP",
    "WB", "AN", "BH",
}

# Common OCR confusions, applied per expected character kind.
_TO_DIGIT = {"O": "0", "Q": "0", "D": "0", "I": "1", "L": "1", "Z": "2", "S": "5", "B": "8", "G": "6", "T": "7"}
_TO_ALPHA = {"0": "O", "1": "I", "2": "Z", "5": "S", "8": "B", "6": "G", "4": "A"}


def clean_raw(text: str) -> str:
    """Uppercase and strip anything that can't be on a plate."""
    return re.sub(r"[^A-Z0-9]", "", (text or "").upper())


def _fix_positional(s: str) -> Optional[str]:
    """Apply layout-aware O/0 style corrections for a standard-format string.

    Layout: [A A] [D D] [A..] [D D D D]. We know the head is 2 letters and the
    tail is 4 digits; correct those confidently. Returns None if length is off.
    """
    if len(s) < 8 or len(s) > 10:
        return None
    chars = list(s)
    # First two must be letters (state code).
    for i in (0, 1):
        if chars[i].isdigit():
            chars[i] = _TO_ALPHA.get(chars[i], chars[i])
    # Last four must be digits.
    for i in range(len(chars) - 4, len(chars)):
        if chars[i].isalpha():
            chars[i] = _TO_DIGIT.get(chars[i], chars[i])
    return "".join(chars)


def normalize_plate(raw: str) -> Tuple[Optional[str], float]:
    """Return (normalised_plate, confidence 0..1). None if it can't be a plate.

    Confidence: 1.0 clean match, 0.7 matched after OCR-confusion repair,
    0.0 if it doesn't fit any Indian format.
    """
    s = clean_raw(raw)
    if not s:
        return None, 0.0

    if _STD_RE.match(s) or _BH_RE.match(s):
        conf = 1.0 if s[:2] in _STATE_CODES or _BH_RE.match(s) else 0.85
        return s, conf

    fixed = _fix_positional(s)
    if fixed and (_STD_RE.match(fixed) or _BH_RE.match(fixed)):
        conf = 0.7 if fixed[:2] in _STATE_CODES or _BH_RE.match(fixed) else 0.6
        return fixed, conf

    return None, 0.0


def is_valid_indian_plate(text: str) -> bool:
    plate, _ = normalize_plate(text)
    return plate is not None


# --------------------------------------------------------------------------- #
# OCR engines                                                                 #
# --------------------------------------------------------------------------- #

class PlateReader:
    name = "none"

    def available(self) -> bool:
        return False

    def read(self, plate_crop: np.ndarray) -> Tuple[Optional[str], float]:
        return None, 0.0


class EasyOCRReader(PlateReader):
    name = "easyocr"

    def __init__(self, gpu: bool = False):
        import easyocr  # optional dependency

        self._reader = easyocr.Reader(["en"], gpu=gpu, verbose=False)

    def available(self) -> bool:
        return True

    def read(self, plate_crop: np.ndarray) -> Tuple[Optional[str], float]:
        if plate_crop is None or plate_crop.size == 0:
            return None, 0.0
        results = self._reader.readtext(plate_crop, detail=1, paragraph=False)
        best, best_conf = None, 0.0
        for _box, text, conf in results:
            plate, fmt_conf = normalize_plate(text)
            if plate and fmt_conf * conf > best_conf:
                best, best_conf = plate, float(fmt_conf * conf)
        return best, best_conf


class TesseractReader(PlateReader):
    name = "tesseract"

    def __init__(self) -> None:
        import pytesseract  # optional dependency

        self._pt = pytesseract

    def available(self) -> bool:
        return True

    def read(self, plate_crop: np.ndarray) -> Tuple[Optional[str], float]:
        if plate_crop is None or plate_crop.size == 0:
            return None, 0.0
        cfg = "--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        text = self._pt.image_to_string(plate_crop, config=cfg)
        return normalize_plate(text)


def build_reader(mode: str = "auto") -> PlateReader:
    mode = (mode or "auto").lower()
    if mode == "off":
        return PlateReader()

    order = {
        "auto": ("easyocr", "tesseract"),
        "easyocr": ("easyocr",),
        "tesseract": ("tesseract",),
    }.get(mode, ("easyocr", "tesseract"))

    for engine in order:
        try:
            if engine == "easyocr":
                r = EasyOCRReader()
            else:
                r = TesseractReader()
            log.info("ANPR using %s", r.name)
            return r
        except Exception as exc:  # not installed / missing binary
            log.debug("ANPR engine %s unavailable: %s", engine, exc)

    log.warning(
        "No OCR engine available — violations will be logged without plate text. "
        "Install `easyocr` or `pytesseract` (+ tesseract-ocr) to read plates."
    )
    return PlateReader()


def locate_plate_region(vehicle_crop: np.ndarray) -> Optional[np.ndarray]:
    """Return the sub-image most likely to contain the plate.

    Without a dedicated plate-detection model, plates on Indian vehicles sit
    low and central, so we return the bottom-centre band of the vehicle crop.
    A fine-tuned plate detector can replace this with a real bbox.
    """
    if vehicle_crop is None or vehicle_crop.size == 0:
        return None
    h, w = vehicle_crop.shape[:2]
    if h < 10 or w < 10:
        return None
    y0 = int(h * 0.55)
    x0 = int(w * 0.12)
    x1 = int(w * 0.88)
    band = vehicle_crop[y0:h, x0:x1]
    return band if band.size else None
