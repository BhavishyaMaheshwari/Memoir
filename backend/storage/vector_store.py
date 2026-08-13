"""
Memoir — LanceDB Vector Store
Manages vector embeddings for semantic search.

Uses LanceDB for:
- ANN (Approximate Nearest Neighbor) search
- Cosine similarity ranking
- Persistent on-disk storage
"""

from pathlib import Path
from typing import Optional
import numpy as np

from core.config import settings


class VectorStore:
    """
    LanceDB vector store wrapper.
    
    Tables:
    - photo_embeddings: 768-dim SigLIP vectors
    - face_embeddings: 512-dim ArcFace vectors (future)
    """

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._db = None

    def _connect(self):
        """Lazy-connect to LanceDB."""
        if self._db is not None:
            return

        import lancedb
        self._db = lancedb.connect(str(self.db_path))

    def _ensure_table(self, table_name: str, dim: int):
        """Create table if it doesn't exist."""
        self._connect()

        if table_name not in self._db.table_names():
            import pyarrow as pa

            schema = pa.schema([
                pa.field("photo_id", pa.string()),
                pa.field("vector", pa.list_(pa.float32(), dim)),
            ])

            self._db.create_table(table_name, schema=schema)

    def add_embedding(self, photo_id: str, embedding: np.ndarray):
        """Add a single photo embedding."""
        self._ensure_table("photo_embeddings", settings.embedding_dim)

        table = self._db.open_table("photo_embeddings")
        table.add([{
            "photo_id": photo_id,
            "vector": embedding.tolist(),
        }])

    def add_embeddings_batch(self, items: list[dict]):
        """
        Add a batch of embeddings.
        Each item: {"photo_id": str, "vector": np.ndarray}
        """
        self._ensure_table("photo_embeddings", settings.embedding_dim)

        table = self._db.open_table("photo_embeddings")
        records = [
            {"photo_id": item["photo_id"], "vector": item["vector"].tolist()}
            for item in items
        ]
        table.add(records)

    def search(
        self,
        query_vector: np.ndarray,
        limit: int = 50,
    ) -> list[dict]:
        """
        Perform ANN search using cosine similarity.
        
        Returns list of {"photo_id": str, "score": float}
        """
        self._connect()

        if "photo_embeddings" not in self._db.table_names():
            return []

        table = self._db.open_table("photo_embeddings")

        results = (
            table.search(query_vector.tolist())
            .metric("cosine")
            .limit(limit)
            .to_list()
        )

        return [
            {
                "photo_id": r["photo_id"],
                "score": 1 - r.get("_distance", 0),  # Convert distance to similarity
            }
            for r in results
        ]

    def get_similar(self, photo_id: str, limit: int = 20) -> list[dict]:
        """Find visually similar photos by re-searching with the photo's own embedding."""
        self._connect()

        if "photo_embeddings" not in self._db.table_names():
            return []

        table = self._db.open_table("photo_embeddings")

        # Find the photo's embedding
        results = table.search().where(f"photo_id = '{photo_id}'").limit(1).to_list()

        if not results:
            return []

        vector = results[0]["vector"]

        # Search with that vector, excluding self
        similar = (
            table.search(vector)
            .metric("cosine")
            .limit(limit + 1)
            .to_list()
        )

        return [
            {
                "photo_id": r["photo_id"],
                "score": 1 - r.get("_distance", 0),
            }
            for r in similar
            if r["photo_id"] != photo_id
        ][:limit]


# Global singleton
vector_store = VectorStore(settings.lancedb_dir)
