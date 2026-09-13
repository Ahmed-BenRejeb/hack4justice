from app.config import settings
from app.providers.embeddings import embed


def test_embed_returns_one_vector_per_text_matching_configured_dimensions() -> None:
    vectors = embed(["Ceci est un texte de test.", "This is a test."])

    assert len(vectors) == 2
    assert len(vectors[0]) == settings.embedding_dimensions
    assert len(vectors[1]) == settings.embedding_dimensions


def test_embed_is_multilingual_similar_texts_are_closer_than_unrelated_ones() -> None:
    import math

    def cosine(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b, strict=True))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        return dot / (norm_a * norm_b)

    french, english_translation, unrelated = embed(
        [
            "Le chat dort sur le canape.",
            "The cat is sleeping on the couch.",
            "La banque centrale a publie de nouveaux taux d'interet.",
        ]
    )

    assert cosine(french, english_translation) > cosine(french, unrelated)
