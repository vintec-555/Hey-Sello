from speedradar.plates import normalize_plate, is_valid_indian_plate, clean_raw


def test_clean_raw_strips_noise():
    assert clean_raw(" mh-12 ab 1234 ") == "MH12AB1234"


def test_standard_plate_exact():
    plate, conf = normalize_plate("MH12AB1234")
    assert plate == "MH12AB1234"
    assert conf >= 0.85


def test_single_digit_rto():
    plate, _ = normalize_plate("DL3CX9999")
    assert plate == "DL3CX9999"


def test_bh_series():
    plate, conf = normalize_plate("22 BH 1234 AA")
    assert plate == "22BH1234AA"
    assert conf >= 0.85


def test_ocr_confusion_repair():
    # OCR read state letters as digits and trailing digits as letters.
    plate, conf = normalize_plate("MH12ABI234")   # trailing I should become 1
    assert plate == "MH12AB1234"
    assert 0.5 <= conf < 1.0


def test_leading_zero_to_letter():
    # '0P' should be corrected to 'OP' (state letters can't be digits).
    plate, _ = normalize_plate("0P14FF5678")
    assert plate == "OP14FF5678"


def test_rejects_garbage():
    plate, conf = normalize_plate("HELLO")
    assert plate is None
    assert conf == 0.0


def test_is_valid_helper():
    assert is_valid_indian_plate("KA05MH9000")
    assert not is_valid_indian_plate("!!!")
