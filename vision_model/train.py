import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models
from utils import get_train_transform, get_val_transform

DATA_DIR = 'vision_model/data'
BATCH_SIZE = 32
NUM_EPOCHS = 10
IMG_SIZE = 224
MODEL_PATH = 'vision_model/model/resnet50.pth'

train_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, 'train'), transform=get_train_transform(IMG_SIZE))
val_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, 'val'), transform=get_val_transform(IMG_SIZE))
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

NUM_CLASSES = len(train_dataset.classes)

model = models.resnet50(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-4)

best_acc = 0.0
for epoch in range(NUM_EPOCHS):
    model.train()
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
    # Validation
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
    acc = correct / total
    print(f'Epoch {epoch+1}/{NUM_EPOCHS} - Val Acc: {acc:.4f}')
    if acc > best_acc:
        best_acc = acc
        torch.save(model.state_dict(), MODEL_PATH)
        print('Best model saved.')
print('Training complete.') 