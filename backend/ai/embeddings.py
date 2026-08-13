"""
Memoir — SigLIP Embedding Engine
Generates 768-dim embeddings for images and text queries.

Uses google/siglip-base-patch16-224 for:
- Image embeddings (indexing time)
- Text embeddings (search time)

Embeddings are persisted in LanceDB — never recomputed.
"""

from pathlib import Path
from typing import Optional
import numpy as np


class EmbeddingEngine:
    """
    Lazy-loaded SigLIP embedding engine.
    
    The model is loaded on first use to avoid slow startup.
    This is the core AI component — used for semantic search
    and similarity detection.
    """

    def __init__(self):
        self._model = None
        self._processor = None
        self._tokenizer = None

    def _load(self):
        """Lazy-load the SigLIP model."""
        if self._model is not None:
            return

        # Defer heavy imports
        from transformers import AutoModel, AutoProcessor, AutoTokenizer
        import torch

        model_name = "google/siglip-base-patch16-224"
        print(f"Loading {model_name}...")

        self._model = AutoModel.from_pretrained(model_name)
        self._processor = AutoProcessor.from_pretrained(model_name)
        self._tokenizer = AutoTokenizer.from_pretrained(model_name)

        # Set to eval mode
        self._model.eval()

        # Use MPS (Apple Silicon) if available
        if torch.backends.mps.is_available():
            self._model = self._model.to("mps")

        print("Model loaded successfully")

    def embed_image(self, image_path: Path) -> Optional[np.ndarray]:
        """
        Generate a 768-dim embedding for a single image.
        Called during indexing — result is stored permanently.
        """
        self._load()

        try:
            from PIL import Image
            import torch

            image = Image.open(image_path).convert("RGB")
            inputs = self._processor(images=image, return_tensors="pt")

            if torch.backends.mps.is_available():
                inputs = {k: v.to("mps") for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model.get_image_features(**inputs)

            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                embedding = outputs.pooler_output[0].cpu().numpy()
            elif hasattr(outputs, "image_embeds") and outputs.image_embeds is not None:
                embedding = outputs.image_embeds[0].cpu().numpy()
            else:
                embedding = outputs[0].cpu().numpy()
                if embedding.ndim == 2:
                    embedding = embedding.mean(axis=0)
            embedding = embedding / np.linalg.norm(embedding)

            return embedding

        except Exception as e:
            print(f"Embedding error for {image_path}: {e}")
            return None

    def embed_text(self, query: str) -> Optional[np.ndarray]:
        """
        Generate a 768-dim embedding for a text query.
        Called at search time — should be fast.
        """
        self._load()

        try:
            import torch

            inputs = self._tokenizer(
                query,
                return_tensors="pt",
                padding="max_length",
                truncation=True,
            )

            if torch.backends.mps.is_available():
                inputs = {k: v.to("mps") for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model.get_text_features(**inputs)

            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                embedding = outputs.pooler_output[0].cpu().numpy()
            elif hasattr(outputs, "text_embeds") and outputs.text_embeds is not None:
                embedding = outputs.text_embeds[0].cpu().numpy()
            else:
                embedding = outputs[0].cpu().numpy()
                if embedding.ndim == 2:
                    embedding = embedding.mean(axis=0)
            embedding = embedding / np.linalg.norm(embedding)
            embedding = embedding.astype(np.float32)

            return embedding

        except Exception as e:
            print(f"Text embedding error: {e}")
            return None

    def embed_images_batch(self, image_paths: list[Path]) -> list[Optional[np.ndarray]]:
        """
        Generate embeddings for a batch of images.
        More efficient than single-image embedding.
        """
        self._load()

        results = []
        try:
            from PIL import Image
            import torch

            images = []
            valid_indices = []

            for i, path in enumerate(image_paths):
                try:
                    img = Image.open(path).convert("RGB")
                    images.append(img)
                    valid_indices.append(i)
                except Exception:
                    pass

            if not images:
                return [None] * len(image_paths)

            inputs = self._processor(images=images, return_tensors="pt", padding=True)

            if torch.backends.mps.is_available():
                inputs = {k: v.to("mps") for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model.get_image_features(**inputs)

            # Extract the tensor
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                embeddings = outputs.pooler_output.cpu().numpy()
            elif hasattr(outputs, "image_embeds") and outputs.image_embeds is not None:
                embeddings = outputs.image_embeds.cpu().numpy()
            elif hasattr(outputs, "cpu"):
                embeddings = outputs.cpu().numpy()
            else:
                # Fallback
                embeddings = outputs[0].cpu().numpy()
                if embeddings.ndim == 3:
                    embeddings = embeddings.mean(axis=1) # average pooling if no pooler

            # Normalize each
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / norms
            embeddings = embeddings.astype(np.float32)

            # Map back to original indices
            result_map = {}
            for idx, valid_idx in enumerate(valid_indices):
                result_map[valid_idx] = embeddings[idx]

            results = [
                result_map.get(i, None)
                for i in range(len(image_paths))
            ]

        except Exception as e:
            print(f"Batch embedding error: {e}")
            results = [None] * len(image_paths)

        return results


# Global singleton — loaded lazily
embedding_engine = EmbeddingEngine()
