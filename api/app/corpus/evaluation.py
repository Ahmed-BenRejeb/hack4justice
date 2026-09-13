"""Measures retrieval quality on a question set people wrote (docs/feature-research.md 5.8).

The question set is `corpus/eval/questions.json`, written by team members, never
by a model:
    [{"question": "retenue sur les loyers d'hôtels", "article_ref": "Article 52",
      "paragraph_ref": "I, a)", "written_by": "<name>"}]
A retrieved chunk answers a question when it sits at the expected paragraph or
inside it ("I, a), tiret 2" answers "I, a)"; an empty paragraph_ref accepts the
whole article).

CLI: uv run python -m app.corpus.evaluation
Exit code 0 only when recall@5 meets RETRIEVAL_RECALL_TARGET.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import (
    EVAL_QUESTIONS_PATH,
    RETRIEVAL_EVAL_TOP_K,
    RETRIEVAL_RECALL_TARGET,
)
from app.corpus.chunking import REF_SEPARATOR
from app.corpus.retrieval import search
from app.db.models import CorpusChunk
from app.db.session import SessionLocal


@dataclass(frozen=True)
class Question:
    question: str
    article_ref: str
    paragraph_ref: str
    written_by: str


@dataclass(frozen=True)
class Report:
    # 1-based rank of each question's first answering chunk, None if outside top k.
    ranks: list[int | None]
    # Whether each question's expected passage has a verified chunk.
    verified: list[bool]

    @property
    def recall(self) -> float:
        """Share of questions answered within the top k."""
        return sum(rank is not None for rank in self.ranks) / len(self.ranks)

    @property
    def mean_reciprocal_rank(self) -> float:
        """Mean of 1/rank, counting a miss as 0."""
        return sum(1 / rank for rank in self.ranks if rank) / len(self.ranks)

    @property
    def verified_coverage(self) -> float:
        """Share of questions whose expected passage a person has verified."""
        return sum(self.verified) / len(self.verified)


def load_questions(path: Path) -> list[Question]:
    """Read the question set; an empty set or a question without an author is rejected."""
    questions = [Question(**entry) for entry in json.loads(path.read_text("utf-8"))]
    if not questions:
        raise ValueError(f"question set is empty: {path}")
    for question in questions:
        if not question.written_by.strip():
            raise ValueError(f"question has no author: {question.question!r}")
    return questions


def answers(chunk: CorpusChunk, question: Question) -> bool:
    """Whether a chunk sits at, or inside, the passage a question expects."""
    return chunk.article_ref == question.article_ref and (
        not question.paragraph_ref
        or chunk.paragraph_ref == question.paragraph_ref
        or chunk.paragraph_ref.startswith(question.paragraph_ref + REF_SEPARATOR)
    )


def evaluate(
    db: Session, questions: list[Question], top_k: int = RETRIEVAL_EVAL_TOP_K
) -> Report:
    """Rank the whole corpus for each question, verified or not, so the score reflects retrieval alone."""
    verified_chunks = (
        db.query(CorpusChunk).filter_by(verification_status="verified").all()
    )
    ranks, verified = [], []
    for question in questions:
        results = search(db, question.question, top_k=top_k)
        ranks.append(
            next(
                (
                    rank
                    for rank, hit in enumerate(results, 1)
                    if answers(hit.chunk, question)
                ),
                None,
            )
        )
        verified.append(any(answers(chunk, question) for chunk in verified_chunks))
    return Report(ranks=ranks, verified=verified)


def main(path: Path = Path(EVAL_QUESTIONS_PATH)) -> int:
    """Print the evaluation of the indexed corpus; returns 0 only when the recall target is met."""
    if not path.is_file():
        print(
            f"no question set at {path}; team members write it "
            "(format in app/corpus/evaluation.py). Recall target not met."
        )
        return 1

    questions = load_questions(path)
    with SessionLocal() as db:
        report = evaluate(db, questions)

    for question, rank, verified in zip(
        questions, report.ranks, report.verified, strict=True
    ):
        expected = f"{question.article_ref} {question.paragraph_ref}".strip()
        if rank is None:
            print(f"missed: {question.question!r}, expected {expected}")
        if not verified:
            print(f"awaiting verification: {expected}")
    met = report.recall >= RETRIEVAL_RECALL_TARGET
    print(
        f"{len(questions)} question(s), recall@{RETRIEVAL_EVAL_TOP_K} {report.recall:.2f}, "
        f"MRR {report.mean_reciprocal_rank:.2f}, "
        f"verified coverage {report.verified_coverage:.2f}"
    )
    print(f"recall target {RETRIEVAL_RECALL_TARGET:.2f}: {'met' if met else 'not met'}")
    return 0 if met else 1


if __name__ == "__main__":
    raise SystemExit(main())
