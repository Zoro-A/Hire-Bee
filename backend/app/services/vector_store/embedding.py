from functools import lru_cache


class EmbeddingService:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is not None:
            return self._model
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(self.model_name)
        return self._model

    def encode(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = self._load_model()
        vectors = model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def embedding_size(self) -> int:
        test_vector = self.encode(["python"])
        if not test_vector:
            raise ValueError("Unable to determine embedding size.")
        return len(test_vector[0])


@lru_cache
def get_embedding_service(model_name: str) -> EmbeddingService:
    return EmbeddingService(model_name)
