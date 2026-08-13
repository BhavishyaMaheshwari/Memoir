"""
Memoir — Search API Routes
Handles semantic search using SigLIP + LanceDB.
"""

from fastapi import APIRouter
from models.schemas import SearchRequest, SearchResponse
from search.semantic import semantic_search as perform_semantic_search

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search using SigLIP text encoding + LanceDB ANN.
    """
    results = await perform_semantic_search(request.query, limit=request.limit)
    
    return SearchResponse(
        results=results,
        query=request.query,
    )
