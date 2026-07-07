"""Command-line entry point.

    python -m speedradar --source clip.mp4 --config config.json --output out.mp4

Everything is optional; with no args it tries webcam 0 with default settings.
"""

from __future__ import annotations

import argparse
import logging
import sys

from .config import Config
from .pipeline import SpeedRadar


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="speedradar",
        description="AI speed radar + ANPR for Indian traffic (cars, bikes, buses, autos, trucks).",
    )
    p.add_argument("--source", help="Video file, RTSP URL, or webcam index (default: config/0).")
    p.add_argument("--config", help="Path to a JSON/YAML config file.")
    p.add_argument("--output", help="Write an annotated video here (e.g. out.mp4).")
    p.add_argument("--violations-dir", help="Directory for violation logs + snapshots.")
    p.add_argument("--detector", choices=["auto", "yolo", "motion"], help="Detector backend.")
    p.add_argument("--anpr", choices=["auto", "easyocr", "tesseract", "off"], help="Plate OCR engine.")
    p.add_argument("--no-draw", action="store_true", help="Disable annotation (faster, headless).")
    p.add_argument("--progress-every", type=int, default=50, help="Log progress every N frames.")
    p.add_argument("-v", "--verbose", action="store_true", help="Debug logging.")
    return p


def config_from_args(args: argparse.Namespace) -> Config:
    cfg = Config.resolve(args.config)
    if args.source is not None:
        cfg.source = args.source
    if args.output is not None:
        cfg.output = args.output
    if args.violations_dir is not None:
        cfg.violations_dir = args.violations_dir
    if args.detector is not None:
        cfg.detector = args.detector
    if args.anpr is not None:
        cfg.anpr = args.anpr
    if args.no_draw:
        cfg.draw = False
    return cfg


def main(argv=None) -> int:
    args = build_arg_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    cfg = config_from_args(args)
    radar = SpeedRadar(cfg)
    stats = radar.run(progress_every=args.progress_every)

    print("\n=== SpeedRadar summary ===")
    print(f"frames processed : {stats.frames}")
    print(f"vehicles tracked : {stats.tracks_seen}")
    print(f"violations       : {stats.violations}")
    print(f"processing speed : {stats.processing_fps:.1f} fps")
    print(f"logs             : {cfg.violations_dir}/violations.csv (+ .jsonl)")
    if cfg.output:
        print(f"annotated video  : {cfg.output}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
