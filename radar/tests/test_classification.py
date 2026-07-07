from speedradar.classification import classify, normalize_label, is_vehicle
from speedradar.config import VehicleClass
from speedradar.geometry import BBox


def test_label_normalisation():
    assert normalize_label("motorcycle") == VehicleClass.BIKE
    assert normalize_label("BUS") == VehicleClass.BUS
    assert normalize_label("autorickshaw") == VehicleClass.AUTO
    assert normalize_label("spaceship") == VehicleClass.UNKNOWN


def test_is_vehicle():
    assert is_vehicle(VehicleClass.CAR)
    assert is_vehicle(VehicleClass.AUTO)
    assert not is_vehicle(VehicleClass.PERSON)


def test_custom_auto_label_passthrough():
    # A fine-tuned model emitting 'auto' should be trusted directly.
    vc = classify("auto", BBox(0, 0, 100, 100), frame_height=480)
    assert vc == VehicleClass.AUTO


def test_heuristic_reclassifies_small_boxy_car_as_auto():
    # Small, boxy, near the bottom of frame -> heuristic auto.
    fh = 480
    bbox = BBox(300, 380, 360, 450)  # w=60 h=70 aspect~0.86, y2=450 (>0.55*480)
    vc = classify("car", bbox, frame_height=fh, heuristic_auto=True)
    assert vc == VehicleClass.AUTO


def test_heuristic_leaves_large_car_alone():
    fh = 480
    bbox = BBox(100, 200, 400, 460)  # wide + tall -> a real car
    vc = classify("car", bbox, frame_height=fh, heuristic_auto=True)
    assert vc == VehicleClass.CAR


def test_heuristic_can_be_disabled():
    fh = 480
    bbox = BBox(300, 380, 360, 450)
    vc = classify("car", bbox, frame_height=fh, heuristic_auto=False)
    assert vc == VehicleClass.CAR
