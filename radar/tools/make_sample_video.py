"""Generate a synthetic traffic clip so the pipeline can be run end-to-end
without real CCTV footage.

Two coloured rectangles ("vehicles") move down a road plane at known real-world
speeds. The scene uses the same 4-point calibration written to
`config.sample.json`, so the estimated speeds should land near the ground truth
(one below the limit, one clearly over it).

    python tools/make_sample_video.py --out sample.mp4
"""

from __future__ import annotations

import argparse

import numpy as np


def main() -> int:
    import cv2

    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sample.mp4")
    ap.add_argument("--seconds", type=float, default=6.0)
    ap.add_argument("--fps", type=int, default=25)
    args = ap.parse_args()

    W, H = 640, 480
    fps = args.fps
    n = int(args.seconds * fps)

    # Ground-plane calibration used by config.sample.json:
    # image trapezoid -> a 10m (wide) x 40m (deep) road patch, metres.
    # A vehicle traversing y=430 -> y=120 covers ~36 m of that patch.
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(args.out, fourcc, fps, (W, H))

    # Two vehicles: (start_y, speed_px_per_frame, colour, width, height)
    # Speeds chosen so #1 ~ under limit, #2 ~ well over.
    vehicles = [
        {"x": 240, "y": 470, "vy": -3.4, "color": (0, 200, 0), "w": 46, "h": 34},
        {"x": 360, "y": 470, "vy": -6.6, "color": (0, 0, 220), "w": 42, "h": 30},
    ]

    for _ in range(n):
        frame = np.full((H, W, 3), 60, dtype=np.uint8)
        # Road: darker trapezoid.
        road = np.array([[200, 120], [440, 120], [560, 470], [80, 470]], np.int32)
        cv2.fillPoly(frame, [road], (90, 90, 90))
        # Lane dashes.
        for ly in range(120, 470, 40):
            cv2.line(frame, (320, ly), (320, ly + 18), (230, 230, 230), 2)

        for v in vehicles:
            v["y"] += v["vy"]
            if v["y"] < 110:
                v["y"] = 470  # loop back
            x, y = int(v["x"]), int(v["y"])
            # Shrink with perspective (further up = smaller).
            scale = 0.5 + 0.5 * (y - 110) / (470 - 110)
            w = int(v["w"] * scale)
            h = int(v["h"] * scale)
            cv2.rectangle(frame, (x - w // 2, y - h // 2), (x + w // 2, y + h // 2), v["color"], -1)
            cv2.rectangle(frame, (x - w // 2, y - h // 2), (x + w // 2, y + h // 2), (20, 20, 20), 1)

        writer.write(frame)

    writer.release()
    print(f"wrote {args.out} ({n} frames @ {fps}fps, {W}x{H})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
