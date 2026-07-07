# 🚦 SpeedRadar — AI speed radar + ANPR for Indian traffic

Detects and tracks vehicles in a video stream (CCTV / RTSP / webcam / file),
estimates each vehicle's **speed** from a calibrated road plane, reads the
**number plate**, and logs anything over the limit — cars, **bikes**, buses,
**auto-rickshaws**, trucks and bicycles.

Built to run **anywhere**: the heavy models (YOLO detection, OCR) are optional
and pluggable. With nothing but `numpy` + `opencv`, it still runs end-to-end
using a motion-based detector, so you can prove the pipeline before investing
in a GPU or a fine-tuned model.

```
detect ─▶ track ─▶ classify ─▶ estimate speed ─▶ (if speeding) read plate ─▶ log + snapshot ─▶ annotate
```

---

## Quick start

```bash
cd radar
pip install -r requirements.txt          # just numpy + opencv are required

# 1) make a synthetic traffic clip (no real footage needed)
python tools/make_sample_video.py --out sample.mp4

# 2) run the radar on it
python -m speedradar --config config.sample.json
```

You'll get:

| Output | Where |
|--------|-------|
| Violation log (spreadsheet) | `violations/violations.csv` |
| Violation log (machine-readable) | `violations/violations.jsonl` |
| Cropped snapshot per offender | `violations/snapshots/` |
| Annotated video | `sample.annotated.mp4` |

Run against your own source:

```bash
python -m speedradar --source /path/to/cctv.mp4 --config myconfig.json --output out.mp4
python -m speedradar --source rtsp://user:pass@camera/stream --config myconfig.json
python -m speedradar --source 0            # webcam
```

---

## Going from demo to production accuracy

The package targets real models and **degrades gracefully** when they're absent.

| Capability | Best (install this) | Fallback (built-in) |
|-----------|---------------------|---------------------|
| Vehicle detection + class | `pip install ultralytics` (YOLOv8) | motion / background-subtraction (class = `unknown`) |
| Auto-rickshaw class | YOLO **fine-tuned** on an Indian dataset with an `auto` class | geometric heuristic (`classification.py`) |
| Number plate reading | `pip install easyocr` *or* `pip install pytesseract` (+ `tesseract-ocr`) | plate located but text left blank |

Nothing here throws just because a model is missing — it logs what it chose and
carries on. Turn a backend on explicitly with `--detector yolo` / `--anpr easyocr`.

> **Why the fallback isn't enough on its own:** background subtraction has no
> class labels and produces fragmented tracks, so per-vehicle speed attribution
> is rough. It exists to validate wiring and geometry — use YOLO for real
> enforcement.

---

## Calibration (this is what makes km/h real)

Speed needs a pixel→metre mapping. A camera looks at the road at an angle, so a
car far up the road moving 10 px is much faster than one near the camera moving
10 px. We correct this with a **ground-plane homography**: pick 4+ points on the
flat road in the image and give their real-world coordinates in metres.

```json
"calibration": {
  "image_points":  [[200,120], [440,120], [560,470], [80,470]],
  "world_points":  [[0,40],    [10,40],   [10,0],    [0,0]]
}
```

- `image_points` — pixels of a road patch (e.g. lane corners, road markings).
- `world_points` — the same points in metres (measure the lane width and a
  known length; here a 10 m × 40 m patch).

**Without calibration** the pipeline runs but reports speeds in *pixel units*
and refuses to flag violations (it says so loudly). For a near-top-down camera
you can instead set `calibration.meters_per_pixel`.

There's also a two-line speed trap (`speed.LineCrossing`) — time between
crossing two lines a known distance apart — handy when homography is awkward.

---

## Configuration

Any field in `speedradar/config.py` can be set in the JSON/YAML config or
overridden by a CLI flag. Highlights:

```jsonc
{
  "source": "sample.mp4",
  "detector": "auto",              // auto | yolo | motion
  "anpr": "auto",                  // auto | easyocr | tesseract | off
  "model_path": "yolov8n.pt",      // ultralytics weights (auto-downloaded)
  "conf_threshold": 0.35,
  "min_hits_before_speed": 3,      // ignore brand-new tracks
  "speed_smoothing": 0.5,          // EMA on reported speed (0..1)
  "speed_tolerance_kmh": 5.0,      // grace margin before flagging
  "read_plate_on_flag_only": true, // OCR only speeders (saves CPU)
  "speed_limits_kmh": { "car": 60, "bike": 50, "auto": 40, "bus": 50, "truck": 50 }
}
```

Speed limits are **per vehicle class**, matching Indian roads where bikes/autos
are often capped lower than cars on the same stretch. Partial overrides merge
with the built-in defaults.

---

## Number plates

`plates.py` validates and normalises OCR output against Indian formats:

- Standard state series — `MH12AB1234`, `DL3CX9999`
- Bharat (BH) series — `22BH1234AA`

It fixes common OCR confusions **positionally** (the first two chars must be
state letters, the last four must be digits), so `MH12ABI234` → `MH12AB1234`,
and returns a confidence that reflects whether it was a clean match or a repair.

---

## Project layout

```
radar/
├── speedradar/
│   ├── config.py          # dataclass config + JSON/YAML loading, per-class limits
│   ├── geometry.py        # BBox / Detection / Track (pure python, unit-tested)
│   ├── calibration.py     # image→world homography (self-contained DLT solver)
│   ├── detection.py       # YoloDetector + MotionDetector fallback, build_detector()
│   ├── tracking.py        # IOUTracker (SORT-lite, greedy IOU)
│   ├── classification.py  # COCO/label → Indian vehicle class (+ auto heuristic)
│   ├── speed.py           # SpeedEstimator (EMA) + LineCrossing trap
│   ├── plates.py          # Indian ANPR: validation + EasyOCR/Tesseract engines
│   ├── violations.py      # JSONL/CSV logging + snapshot crops
│   ├── annotate.py        # draw boxes/speeds/plates/HUD
│   ├── pipeline.py        # SpeedRadar: the per-frame loop + video driver
│   └── cli.py             # `python -m speedradar` entry point
├── tools/make_sample_video.py   # synthetic clip generator (runnable demo)
├── tests/                 # pytest: speed math, plates, tracking, classification, config
├── config.sample.json
└── requirements.txt
```

## Tests

```bash
pip install pytest && python -m pytest -q
```

Core maths (homography, speed, plate normalisation, tracker association) is
numpy-only so the suite runs without YOLO or OCR installed.

---

## Notes, limits & responsible use

- Accuracy depends on calibration quality and a stable detector/tracker. For
  enforcement-grade results, use a fine-tuned YOLO, a dedicated plate detector,
  and per-camera calibration validated against a known-speed reference.
- The auto-rickshaw heuristic is a stopgap; train a model with an explicit class.
- This is a detection/measurement tool. Any real enforcement use must comply
  with local law on evidentiary standards, calibration certification, data
  retention and privacy (number plates + vehicle images are personal data).
