import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image
model = AutoModel.from_pretrained("google/siglip-base-patch16-224")
processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
img = Image.new('RGB', (224, 224))
inputs = processor(images=img, return_tensors="pt")
outputs = model.get_image_features(**inputs)
print(outputs.shape)
