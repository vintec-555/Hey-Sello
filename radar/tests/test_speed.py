import numpy as np

from speedradar.calibration import GroundPlane, _dlt_homography
from speedradar.config import CalibrationConfig
from speedradar.geometry import Track
from speedradar.speed import SpeedEstimator, LineCrossing


def test_homography_recovers_known_distance():
    # Map an image square to a 10m x 10m world square.
    img = [(100, 100), (300, 100), (300, 300), (100, 300)]
    world = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    cal = CalibrationConfig(image_points=img, world_points=world)
    gp = GroundPlane.from_config(cal)

    # The full width of the image square is 10 metres.
    d = gp.world_distance((100, 100), (300, 100))
    assert abs(d - 10.0) < 1e-6


def test_scalar_meters_per_pixel():
    gp = GroundPlane(meters_per_pixel=0.05)
    assert abs(gp.world_distance((0, 0), (100, 0)) - 5.0) < 1e-9


def test_speed_estimate_kmh():
    # 10m x 10m homography, object crosses 10 m in 25 frames at 25 fps = 1 s.
    img = [(100, 100), (300, 100), (300, 300), (100, 300)]
    world = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    gp = GroundPlane.from_config(CalibrationConfig(image_points=img, world_points=world))
    est = SpeedEstimator(gp, smoothing=0.0, window=100)

    tr = Track(track_id=1, bbox=None, label="car", score=1.0)
    fps = 25.0
    # Move from x=100 to x=300 (10 m) over 25 frames along y=200.
    for i in range(26):
        x = 100 + (200 * i / 25)
        tr.history.append((i, i / fps, (x, 200)))
    speed = est.update(tr)
    # 10 m in 1 s = 10 m/s = 36 km/h.
    assert abs(speed - 36.0) < 1.0


def test_line_crossing_speed():
    # Two horizontal lines 20 m apart, crossed 1 s apart -> 20 m/s -> 72 km/h.
    lc = LineCrossing(line_a=((0, 100), (640, 100)),
                      line_b=((0, 300), (640, 300)),
                      distance_m=20.0)
    tid = 7
    assert lc.update(tid, (320, 90), (320, 110), timestamp=0.0) is None   # crosses A
    speed = lc.update(tid, (320, 290), (320, 310), timestamp=1.0)          # crosses B
    assert speed is not None
    assert abs(speed - 72.0) < 1e-6


def test_teleport_rejected():
    gp = GroundPlane(meters_per_pixel=1.0)  # 1px = 1m -> huge speeds
    est = SpeedEstimator(gp, smoothing=0.0, window=2)
    tr = Track(track_id=1, bbox=None, label="car", score=1.0)
    tr.history.append((0, 0.0, (0, 0)))
    tr.history.append((1, 1 / 25.0, (10000, 0)))  # 10000 m in 0.04s -> absurd
    speed = est.update(tr)
    assert speed is None  # rejected, speed stays None
