"""
Memoir — Semantic Search Engine
Combines SigLIP text embedding + LanceDB ANN + metadata ranking.
"""

from ai.embeddings import embedding_engine
from storage.vector_store import vector_store
from core.database import database


async def semantic_search(query: str, limit: int = 50) -> list[dict]:
    """
    Full semantic search pipeline:
    1. Encode query text → 768-dim vector via SigLIP
    2. ANN search in LanceDB (cosine similarity)
    3. Fetch photo metadata from SQLite
    4. Apply ranking adjustments
    5. Return sorted results
    """
    # Step 1: Encode query
    query_embedding = embedding_engine.embed_text(query)
    if query_embedding is None:
        return []

    # Step 2: ANN search
    vector_results = vector_store.search(query_embedding, limit=limit * 2)
    if not vector_results:
        return []

    # Step 3: Fetch metadata
    db = database.db
    results = []

    for vr in vector_results[:limit]:
        cursor = await db.execute(
            "SELECT * FROM photos WHERE id = ?",
            (vr["photo_id"],),
        )
        row = await cursor.fetchone()
        if row:
            photo_data = dict(row)
            results.append({
                "photo": photo_data,
                "score": vr["score"],
                "match_type": "semantic",
            })

    # Step 4: Rank (currently by score; expand later with recency, OCR, people)
    results.sort(key=lambda r: r["score"], reverse=True)

    return results
