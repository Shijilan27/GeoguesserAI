import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models
from torchvision.models import ResNet50_Weights
from utils import get_train_transform

DATA_DIR = 'vision_model/datasets/pole_dataset'
BATCH_SIZE = 32
NUM_EPOCHS = 10
IMG_SIZE = 224
MODEL_PATH = 'vision_model/model/resnet50.pth'

# Only training set
train_dataset = datasets.ImageFolder(DATA_DIR, transform=get_train_transform(IMG_SIZE))
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)

NUM_CLASSES = len(train_dataset.classes)

model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-4)

for epoch in range(NUM_EPOCHS):
    model.train()
    running_loss = 0.0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
    print(f'Epoch {epoch+1}/{NUM_EPOCHS} - Loss: {running_loss/len(train_loader):.4f}')

torch.save(model.state_dict(), MODEL_PATH)
print('Model saved.')

# Save class names for inference
with open('vision_model/model/class_names.txt', 'w') as f:
    for class_name in train_dataset.classes:
        f.write(f'{class_name}\n') 