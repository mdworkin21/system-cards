from system_cards.pdftext import normalize, page_texts, pages_containing, quote_on_page


def test_page_texts_in_order(tiny_pdf):
    pages = page_texts(tiny_pdf)
    assert len(pages) == 2
    assert "cyber CCL" in pages[0]
    assert "safeguards" in pages[1]


def test_quote_found_on_its_page_only(tiny_pdf):
    pages = page_texts(tiny_pdf)
    assert quote_on_page("remains below the cyber CCL", pages[0])
    assert not quote_on_page("remains below the cyber CCL", pages[1])
    assert pages_containing("remains below the cyber CCL", pages) == [1]


def test_curly_apostrophe_in_page_matches_straight_in_quote():
    page = "We found the model" + chr(0x2019) + "s results consistent."
    assert quote_on_page("the model's results consistent", page)


def test_whitespace_and_line_breaks_are_collapsed(tiny_pdf):
    assert quote_on_page("Second   page\nsays something", page_texts(tiny_pdf)[1])


def test_line_end_hyphenation_matches_joined_and_kept(tiny_pdf):
    page = page_texts(tiny_pdf)[1]
    assert quote_on_page("something information about safeguards", page)
    assert quote_on_page("something infor-mation about safeguards", page)


def test_absent_quote_is_absent(tiny_pdf):
    assert pages_containing("this sentence is not in the document", page_texts(tiny_pdf)) == []


def test_normalize_is_idempotent():
    s = (
        "  "
        + chr(0x201C)
        + "Quoted"
        + chr(0x201D)
        + "  "
        + chr(0x2014)
        + " text"
        + chr(0xA0)
        + "here  "
    )
    assert normalize(normalize(s)) == normalize(s) == '"Quoted" - text here'
