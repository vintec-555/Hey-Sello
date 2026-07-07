"""A small multi-object tracker (SORT-lite, greedy IOU).

No external deps beyond numpy. Enough to hold stable track ids across frames so
speed can be integrated per vehicle. For very crowded scenes swap in a proper
tracker (ByteTrack / DeepSORT) — the Track interface stays the same.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

from .geometry import BBox, Detection, Track


class IOUTracker:
    def __init__(self, iou_threshold: float = 0.3, max_misses: int = 15):
        self.iou_threshold = iou_threshold
        self.max_misses = max_misses
        self._next_id = 1
        self.tracks: Dict[int, Track] = {}

    def _new_track(self, det: Detection, frame_idx: int, ts: float) -> Track:
        tid = self._next_id
        self._next_id += 1
        t = Track(track_id=tid, bbox=det.bbox, label=det.label, score=det.score)
        t.history.append((frame_idx, ts, det.bbox.ground_point))
        self.tracks[tid] = t
        return t

    def update(self, detections: List[Detection], frame_idx: int, ts: float) -> List[Track]:
        """Associate detections to tracks and advance state.

        Returns the list of currently-live tracks (post-update).
        """
        track_ids = list(self.tracks.keys())

        # Build IOU matrix (tracks x detections) and match greedily by best IOU.
        pairs: List[Tuple[float, int, int]] = []
        for ti, tid in enumerate(track_ids):
            tb = self.tracks[tid].bbox
            for di, det in enumerate(detections):
                iou = tb.iou(det.bbox)
                if iou >= self.iou_threshold:
                    pairs.append((iou, tid, di))
        pairs.sort(reverse=True)  # highest IOU first

        matched_tracks: set = set()
        matched_dets: set = set()
        for iou, tid, di in pairs:
            if tid in matched_tracks or di in matched_dets:
                continue
            matched_tracks.add(tid)
            matched_dets.add(di)
            det = detections[di]
            tr = self.tracks[tid]
            tr.bbox = det.bbox
            tr.score = det.score
            # Keep the class label from a real (non-fallback) detector.
            if det.label and det.label != "vehicle":
                tr.label = det.label
            tr.hits += 1
            tr.misses = 0
            tr.history.append((frame_idx, ts, det.bbox.ground_point))
            if len(tr.history) > 64:
                tr.history = tr.history[-64:]

        # Unmatched detections -> new tracks.
        for di, det in enumerate(detections):
            if di not in matched_dets:
                self._new_track(det, frame_idx, ts)

        # Unmatched tracks -> age out.
        for tid in track_ids:
            if tid not in matched_tracks:
                tr = self.tracks[tid]
                tr.misses += 1
                if tr.misses > self.max_misses:
                    del self.tracks[tid]

        return list(self.tracks.values())
