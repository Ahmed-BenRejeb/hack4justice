import hashlib
import json
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.config import EVAL_QUESTIONS_PATH, RETRIEVAL_RECALL_TARGET, settings
from app.corpus.chunking import Page
from app.corpus.evaluation import (
    Question,
    Report,
    answers,
    evaluate,
    load_questions,
)
from app.corpus.evaluation import main as evaluation_main
from app.corpus.load_corpus import main as load_corpus_main
from app.corpus.service import index_source
from app.corpus.verification import VerifiedPassage, apply_register
from app.db.models import CorpusChunk
from tests.fixtures.corpus import make_source

SAMPLE_SOURCE = """
ARTICLE 1 :
I. Dispositions relatives a la retenue a la source sur les paiements aux prestataires de services.
II. Dispositions relatives aux conges payes et a la duree du travail des salaries.

ARTICLE 2 :
Dispositions relatives a l'immatriculation des vehicules automobiles.
"""


def question(text: str, article_ref: str, paragraph_ref: str) -> Question:
    return Question(text, article_ref, paragraph_ref, written_by="Auteur de test")


def test_report_computes_recall_mrr_and_verified_coverage() -> None:
    report = Report(ranks=[1, 2, None], verified=[True, False, False])

    assert report.recall == pytest.approx(2 / 3)
    assert report.mean_reciprocal_rank == pytest.approx(0.5)
    assert report.verified_coverage == pytest.approx(1 / 3)


def test_a_chunk_answers_its_paragraph_and_the_paragraphs_containing_it() -> None:
    chunk = CorpusChunk(article_ref="Article 52", paragraph_ref="I, a), tiret 2")

    assert answers(chunk, question("q", "Article 52", "I, a), tiret 2"))
    assert answers(chunk, question("q", "Article 52", "I, a)"))
    assert answers(chunk, question("q", "Article 52", ""))
    assert not answers(chunk, question("q", "Article 52", "I, b)"))
    assert not answers(chunk, question("q", "Article 52", "I, a), tiret 1"))
    assert not answers(chunk, question("q", "Article 53", "I, a)"))


def test_evaluate_ranks_the_whole_corpus_and_reports_verified_coverage(
    db: Session,
) -> None:
    index_source(db, make_source(), [Page(1, SAMPLE_SOURCE)])
    first = db.query(CorpusChunk).filter_by(paragraph_ref="I").one()
    apply_register(
        db,
        [
            VerifiedPassage(
                source_sha256=make_source().sha256,
                article_ref="Article 1",
                paragraph_ref="I",
                page=1,
                text_sha256=hashlib.sha256(first.text.encode()).hexdigest(),
                checked_by="Relecteur de test",
                checked_on=date(2026, 9, 13),
            )
        ],
    )
    db.commit()

    report = evaluate(
        db,
        [
            question("retenue a la source sur un prestataire", "Article 1", "I"),
            question("immatriculation d'une voiture", "Article 2", ""),
            question("question sans passage attendu indexe", "Article 9", "I"),
        ],
        top_k=1,
    )

    assert report.ranks == [1, 1, None]
    assert report.verified == [True, False, False]


def test_load_questions_rejects_an_unsigned_question_and_an_empty_set(
    tmp_path: Path,
) -> None:
    path = tmp_path / "questions.json"
    path.write_text(json.dumps([]))
    with pytest.raises(ValueError, match="empty"):
        load_questions(path)

    unsigned = {
        "question": "q",
        "article_ref": "Article 1",
        "paragraph_ref": "I",
        "written_by": "",
    }
    path.write_text(json.dumps([unsigned]))
    with pytest.raises(ValueError, match="no author"):
        load_questions(path)


def test_main_reports_the_target_not_met_without_a_question_set(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert evaluation_main(tmp_path / "questions.json") == 1
    assert "no question set" in capsys.readouterr().out


@pytest.mark.skipif(
    not Path(EVAL_QUESTIONS_PATH).is_file(),
    reason="corpus/eval/questions.json not written yet: team members write it",
)
def test_real_question_set_meets_the_recall_target(db: Session) -> None:
    load_corpus_main(Path(settings.corpus_sources_dir))

    report = evaluate(db, load_questions(Path(EVAL_QUESTIONS_PATH)))

    assert report.recall >= RETRIEVAL_RECALL_TARGET
