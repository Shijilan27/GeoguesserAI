from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from utils import load_image
import torch
from torchvision import models
import os

MODEL_PATH = 'vision_model/model/resnet50.pth'
CLASS_NAMES_PATH = 'vision_model/model/class_names.txt'
IMG_SIZE = 224
NUM_CLASSES = None

# Load class names if available
if os.path.exists(CLASS_NAMES_PATH):
    with open(CLASS_NAMES_PATH, 'r') as f:
        class_names = [line.strip() for line in f.readlines()]
    NUM_CLASSES = len(class_names)
else:
    class_names = None
    NUM_CLASSES = 10  # fallback

model = models.resnet50(pretrained=False)
model.fc = torch.nn.Linear(model.fc.in_features, NUM_CLASSES)
model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
model.eval()

app = FastAPI()

@app.post('/predict')
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    import io
    input_tensor = load_image(io.BytesIO(image_bytes), IMG_SIZE)
    with torch.no_grad():
        outputs = model(input_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)
    result = {
        'predicted_class': int(pred.item()),
        'confidence': float(conf.item())
    }
    if class_names:
        result['class_name'] = class_names[pred.item()]
    return JSONResponse(result) 