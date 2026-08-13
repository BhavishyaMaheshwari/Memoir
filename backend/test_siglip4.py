import torch
from transformers import AutoModel, AutoProcessor, AutoTokenizer
model = AutoModel.from_pretrained("google/siglip-base-patch16-224")
processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
tokenizer = AutoTokenizer.from_pretrained("google/siglip-base-patch16-224")

from PIL import Image
img = Image.new('RGB', (224, 224))
inputs = processor(images=img, return_tensors="pt")
outputs_img = model.get_image_features(**inputs)

print("Image:", type(outputs_img))
if hasattr(outputs_img, 'shape'): print("Image shape:", outputs_img.shape)

text_inputs = tokenizer(["test"], return_tensors="pt")
outputs_txt = model.get_text_features(**text_inputs)
print("Text:", type(outputs_txt))
if hasattr(outputs_txt, 'shape'): print("Text shape:", outputs_txt.shape)

