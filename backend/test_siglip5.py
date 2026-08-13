import torch
from transformers import AutoModel, AutoProcessor
model = AutoModel.from_pretrained("google/siglip-base-patch16-224")
processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
from PIL import Image
img = Image.new('RGB', (224, 224))
inputs = processor(text=["a test string"], images=img, return_tensors="pt", padding="max_length")
with torch.no_grad():
    outputs = model(**inputs)
print("Keys in output:", outputs.keys())
print("Image embeds shape:", outputs.image_embeds.shape)
print("Text embeds shape:", outputs.text_embeds.shape)
