import torchvision.transforms as transforms
from PIL import Image

def get_train_transform(img_size=224):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
    ])

def get_val_transform(img_size=224):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
    ])

def load_image(image_bytes, img_size=224):
    image = Image.open(image_bytes).convert('RGB')
    transform = get_val_transform(img_size)
    return transform(image).unsqueeze(0) 