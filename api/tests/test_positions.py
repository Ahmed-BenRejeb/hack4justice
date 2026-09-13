from app.extraction.ocr import WordBox
from app.extraction.positions import locate_field


def _words(*entries: tuple[int, str, float, float, float, float]) -> tuple[WordBox, ...]:
    return tuple(
        WordBox(page=page, text=text, x0=x0, y0=y0, x1=x1, y1=y1)
        for page, text, x0, y0, x1, y1 in entries
    )


def test_locate_field_finds_a_single_matching_word() -> None:
    words = _words((1, "1122334M", 10.0, 20.0, 60.0, 35.0))

    box = locate_field("1122334M", words)

    assert box is not None
    assert box.page == 1
    assert (box.x0, box.y0, box.x1, box.y1) == (10.0, 20.0, 60.0, 35.0)


def test_locate_field_spans_consecutive_words() -> None:
    words = _words(
        (1, "Cabinet", 10.0, 20.0, 50.0, 35.0),
        (1, "Fiscal", 55.0, 20.0, 90.0, 35.0),
        (1, "Ben", 95.0, 20.0, 115.0, 35.0),
        (1, "Ammar", 120.0, 20.0, 160.0, 35.0),
    )

    box = locate_field("Cabinet Fiscal Ben Ammar", words)

    assert box is not None
    assert (box.x0, box.y0, box.x1, box.y1) == (10.0, 20.0, 160.0, 35.0)


def test_locate_field_ignores_spacing_and_case_differences() -> None:
    words = _words((1, "1", 10.0, 0.0, 15.0, 10.0), (1, "000,500", 16.0, 0.0, 40.0, 10.0))

    box = locate_field("1000.500", words)

    assert box is not None
    assert (box.x0, box.x1) == (10.0, 40.0)


def test_locate_field_prefers_the_first_matching_page() -> None:
    words = _words(
        (2, "1122334M", 0.0, 0.0, 10.0, 10.0),
        (1, "1122334M", 5.0, 5.0, 15.0, 15.0),
    )

    box = locate_field("1122334M", words)

    assert box is not None
    assert box.page == 1


def test_locate_field_returns_none_with_no_match() -> None:
    words = _words((1, "Autre", 0.0, 0.0, 10.0, 10.0))

    assert locate_field("Introuvable", words) is None


def test_locate_field_returns_none_for_an_empty_value() -> None:
    words = _words((1, "Quelque chose", 0.0, 0.0, 10.0, 10.0))

    assert locate_field("", words) is None
