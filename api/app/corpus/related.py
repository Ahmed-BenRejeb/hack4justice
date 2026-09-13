"""Related texts for a finding (R1, docs/feature-research.md section 5.1).

The query is built deterministically from the rule's verbatim citation and, for
an abstention, the missing fact: no document text and no model are involved.
The citation is already shown as the citation, so passages repeating it are
not related texts.
"""

from sqlalchemy.orm import Session

from app.corpus.chunking import SENTENCE_BREAK
from app.corpus.retrieval import DEFAULT_TOP_K, Hit, search
from app.db.models import Finding, Rule

# A shorter opening ("Ce taux est réduit à :") recurs across paragraphs, so it
# cannot identify the cited passage.
MIN_CITED_OPENING_CHARS = 40


def related_query(rule: Rule, finding: Finding) -> str:
    """The rule's verbatim citation, followed by the missing fact for an abstention."""
    return "\n".join(
        part for part in (rule.verbatim_text, finding.missing_fact) if part
    )


def repeats_citation(passage_text: str, citation: str) -> bool:
    """Whether a passage is the citation: its text, or its opening sentence, appears in it verbatim."""
    cited = " ".join(citation.split())
    text = " ".join(passage_text.split())
    opening = SENTENCE_BREAK.split(text, maxsplit=1)[0]
    return text in cited or (
        len(opening) >= MIN_CITED_OPENING_CHARS and opening in cited
    )


def related_passages(
    db: Session, query: str, citation: str, top_k: int = DEFAULT_TOP_K
) -> list[Hit]:
    """Verified passages for a related-text query, the cited passage left out."""
    hits = search(db, query, top_k=None, verified_only=True)
    return [hit for hit in hits if not repeats_citation(hit.chunk.text, citation)][
        :top_k
    ]
