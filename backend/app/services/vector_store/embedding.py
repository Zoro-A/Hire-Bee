from functools import lru_cache
import hashlib
import math


class EmbeddingService:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name, device="cpu")
        except Exception:
            self._model = None
        return self._model

    @staticmethod
    def _hash_embed(text: str, dims: int = 384) -> list[float]:
        vec = [0.0] * dims
        tokens = [t.strip().lower() for t in text.replace(",", " ").split() if t.strip()]
        if not tokens:
            return vec
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:2], "big") % dims
            sign = -1.0 if digest[2] % 2 else 1.0
            vec[idx] += sign
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    def encode(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = self._load_model()
        if model is not None:
            vectors = model.encode(texts, normalize_embeddings=True)
            return [vector.tolist() for vector in vectors]
        return [self._hash_embed(t) for t in texts]

    def embedding_size(self) -> int:
        test_vector = self.encode(["python"])
        if not test_vector:
            raise ValueError("Unable to determine embedding size.")
        return len(test_vector[0])


@lru_cache
def get_embedding_service(model_name: str) -> EmbeddingService:
    return EmbeddingService(model_name)
