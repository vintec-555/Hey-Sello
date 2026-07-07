from speedradar.config import Config, DEFAULT_SPEED_LIMITS_KMH


def test_partial_speed_limits_merge_with_defaults():
    cfg = Config.from_dict({"speed_limits_kmh": {"car": 80}})
    assert cfg.speed_limits_kmh["car"] == 80          # overridden
    assert cfg.speed_limits_kmh["bike"] == DEFAULT_SPEED_LIMITS_KMH["bike"]  # kept


def test_limit_for_unknown_falls_back():
    cfg = Config()
    assert cfg.limit_for("spaceship") == cfg.speed_limits_kmh["unknown"]


def test_calibration_parsed_from_dict():
    cfg = Config.from_dict({
        "calibration": {
            "image_points": [[0, 0], [1, 0], [1, 1], [0, 1]],
            "world_points": [[0, 0], [10, 0], [10, 10], [0, 10]],
        }
    })
    assert cfg.calibration.is_homography()
    assert cfg.calibration.image_points[1] == (1, 0)
