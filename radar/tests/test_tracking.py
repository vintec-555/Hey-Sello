from speedradar.geometry import BBox, Detection
from speedradar.tracking import IOUTracker


def _det(x1, y1, x2, y2, label="car"):
    return Detection(BBox(x1, y1, x2, y2), 0.9, label)


def test_track_persists_across_frames():
    tr = IOUTracker(iou_threshold=0.3, max_misses=5)
    tracks = tr.update([_det(100, 100, 150, 140)], 0, 0.0)
    assert len(tracks) == 1
    tid = tracks[0].track_id

    # Move slightly — should keep the same id (boxes overlap).
    tracks = tr.update([_det(104, 104, 154, 144)], 1, 0.04)
    assert len(tracks) == 1
    assert tracks[0].track_id == tid
    assert tracks[0].hits == 2


def test_new_object_gets_new_id():
    tr = IOUTracker()
    tr.update([_det(100, 100, 150, 140)], 0, 0.0)
    tracks = tr.update([_det(100, 100, 150, 140), _det(400, 400, 450, 440)], 1, 0.04)
    ids = sorted(t.track_id for t in tracks)
    assert len(ids) == 2
    assert ids == [1, 2]


def test_track_ages_out():
    tr = IOUTracker(max_misses=2)
    tr.update([_det(100, 100, 150, 140)], 0, 0.0)
    # No detections for 3 frames -> should be dropped after max_misses.
    tr.update([], 1, 0.04)
    tr.update([], 2, 0.08)
    tracks = tr.update([], 3, 0.12)
    assert tracks == []


def test_history_accumulates_ground_points():
    tr = IOUTracker()
    tr.update([_det(100, 100, 150, 140)], 0, 0.0)
    tracks = tr.update([_det(102, 108, 152, 148)], 1, 0.04)
    assert len(tracks[0].history) == 2
    # Ground point is bottom-centre.
    fx, fy = tracks[0].history[-1][2]
    assert fy == 148
