# import tensorflow as tf
# from tensorflow import keras
# from tensorflow.keras import layers
# from tensorflow.keras.preprocessing.image import ImageDataGenerator
# from tensorflow.keras.applications import EfficientNetB0
# from tensorflow.keras.optimizers import Adam
# from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
# import os
# import numpy as np

# # Configure GPU for optimal performance
# def configure_gpu():
#     """Configure GPU settings for TensorFlow"""
#     gpus = tf.config.experimental.list_physical_devices('GPU')
#     if gpus:
#         try:
#             # Set memory growth to True for all GPUs
#             for gpu in gpus:
#                 tf.config.experimental.set_memory_growth(gpu, True)
            
#             # Use a GPU strategy for distributed training
#             strategy = tf.distribute.MirroredStrategy()
#             print(f"Number of devices: {strategy.num_replicas_in_sync}")
#             print("✅ GPU is configured successfully")
#             return strategy
#         except RuntimeError as e:
#             # Memory growth must be set before GPUs have been initialized
#             print(f"❌ Error configuring GPU: {e}")
#             return None
#     else:
#         print("⚠️  No GPU detected. Using CPU instead.")
#         return None

# def create_cnn_model(input_shape=(224, 224, 3), num_classes=4, strategy=None):
#     """Create CNN model for soil classification"""
#     # Force input to be 3 channels for EfficientNet compatibility
#     if input_shape[-1] == 1:
#         # If images are grayscale, we'll convert them to RGB
#         input_shape = (input_shape[0], input_shape[1], 3)
#         print("🔄 Converting grayscale to RGB for EfficientNet compatibility")
    
#     # Use strategy scope if GPU is available
#     if strategy:
#         with strategy.scope():
#             # Use EfficientNet without pre-trained weights to avoid shape issues
#             base_model = EfficientNetB0(
#                 include_top=False,
#                 weights=None,  # No pre-trained weights to avoid shape mismatch
#                 input_shape=input_shape,
#                 pooling='avg'
#             )
            
#             # Freeze base model
#             base_model.trainable = False
            
#             model = keras.Sequential([
#                 base_model,
#                 layers.Dropout(0.3),
#                 layers.Dense(512, activation='relu'),
#                 layers.BatchNormalization(),
#                 layers.Dropout(0.5),
#                 layers.Dense(num_classes, activation='softmax')
#             ])
#     else:
#         # Use EfficientNet without pre-trained weights to avoid shape issues
#         base_model = EfficientNetB0(
#             include_top=False,
#             weights=None,  # No pre-trained weights to avoid shape mismatch
#             input_shape=input_shape,
#             pooling='avg'
#         )
        
#         # Freeze base model
#         base_model.trainable = False
        
#         model = keras.Sequential([
#             base_model,
#             layers.Dropout(0.3),
#             layers.Dense(512, activation='relu'),
#             layers.BatchNormalization(),
#             layers.Dropout(0.5),
#             layers.Dense(num_classes, activation='softmax')
#         ])
    
#     return model

# # Custom data generator to ensure all images are 3 channels
# def ensure_3_channels(image):
#     """Convert image to 3 channels if it's grayscale"""
#     if len(image.shape) == 2 or image.shape[2] == 1:
#         # Convert grayscale to RGB by repeating the channel
#         return np.repeat(image, 3, axis=-1)
#     elif image.shape[2] == 4:
#         # Remove alpha channel if present
#         return image[:, :, :3]
#     else:
#         return image

# def train_cnn_model():
#     """Train CNN model for soil image classification"""
#     try:
#         # Configure GPU before any TensorFlow operations
#         strategy = configure_gpu()
        
#         # Updated dataset paths based on your folder structure
#         dataset_dir = os.path.join('ml-backend', 'data','Dataset')
#         train_dir = os.path.join(dataset_dir, 'Train')
#         test_dir = os.path.join(dataset_dir, 'test')
        
#         if not os.path.exists(train_dir):
#             print(f"❌ Training directory not found: {train_dir}")
#             return None
#         if not os.path.exists(test_dir):
#             print(f"❌ Test directory not found: {test_dir}")
#             return None

#         # Custom preprocessing function to ensure 3 channels
#         def preprocess_function(x):
#             x = ensure_3_channels(x)
#             return x

#         # Use data augmentation for training
#         train_datagen = ImageDataGenerator(
#             rescale=1./255,
#             rotation_range=20,
#             width_shift_range=0.2,
#             height_shift_range=0.2,
#             horizontal_flip=True,
#             vertical_flip=True,
#             fill_mode='nearest',
#             validation_split=0.2,  # Use 20% of training data for validation
#             preprocessing_function=preprocess_function
#         )
        
#         # Simple rescaling for test data
#         test_datagen = ImageDataGenerator(
#             rescale=1./255,
#             preprocessing_function=preprocess_function
#         )
        
#         # Always use RGB mode to ensure 3 channels
#         color_mode = 'rgb'
#         target_size = (224, 224)
#         input_shape = (224, 224, 3)
#         print("📷 Using RGB mode (3 channels) for EfficientNet compatibility")
        
#         # Training generator
#         train_generator = train_datagen.flow_from_directory(
#             train_dir,
#             target_size=target_size,
#             batch_size=32 * (strategy.num_replicas_in_sync if strategy else 1),
#             class_mode='categorical',
#             subset='training',
#             shuffle=True,
#             color_mode=color_mode
#         )
        
#         # Validation generator (from training data)
#         val_generator = train_datagen.flow_from_directory(
#             train_dir,
#             target_size=target_size,
#             batch_size=32 * (strategy.num_replicas_in_sync if strategy else 1),
#             class_mode='categorical',
#             subset='validation',
#             shuffle=False,
#             color_mode=color_mode
#         )
        
#         # Test generator (from separate test folder)
#         test_generator = test_datagen.flow_from_directory(
#             test_dir,
#             target_size=target_size,
#             batch_size=32 * (strategy.num_replicas_in_sync if strategy else 1),
#             class_mode='categorical',
#             shuffle=False,
#             color_mode=color_mode
#         )
        
#         print(f"Training classes: {train_generator.class_indices}")
#         print(f"Validation classes: {val_generator.class_indices}")
#         print(f"Test classes: {test_generator.class_indices}")

#         NUM_CLASSES = len(train_generator.class_indices)
#         print(f"Number of classes: {NUM_CLASSES}")
        
#         # Create model
#         model = create_cnn_model(input_shape=input_shape, num_classes=NUM_CLASSES, strategy=strategy)
        
#         # Use mixed precision for better GPU performance
#         policy = tf.keras.mixed_precision.Policy('mixed_float16')
#         tf.keras.mixed_precision.set_global_policy(policy)
#         print('Mixed precision enabled')
        
#         # Compile model
#         if strategy:
#             with strategy.scope():
#                 model.compile(
#                     optimizer=Adam(learning_rate=0.001),
#                     loss='categorical_crossentropy',
#                     metrics=['accuracy']
#                 )
#         else:
#             model.compile(
#                 optimizer=Adam(learning_rate=0.001),
#                 loss='categorical_crossentropy',
#                 metrics=['accuracy']
#             )
        
#         # Display model summary
#         model.summary()
        
#         callbacks = [
#             EarlyStopping(patience=10, restore_best_weights=True, verbose=1),
#             ReduceLROnPlateau(factor=0.2, patience=5, verbose=1),
#             tf.keras.callbacks.TensorBoard(log_dir='./logs', profile_batch='500,520')
#         ]
        
#         print("🚀 Starting training...")
        
#         # Train the model
#         if strategy:
#             with strategy.scope():
#                 history = model.fit(
#                     train_generator,
#                     epochs=30,
#                     validation_data=val_generator,
#                     callbacks=callbacks,
#                     verbose=1
#                 )
#         else:
#             history = model.fit(
#                 train_generator,
#                 epochs=30,
#                 validation_data=val_generator,
#                 callbacks=callbacks,
#                 verbose=1
#             )
        
#         # Fine-tuning
#         print("🔄 Starting fine-tuning phase...")
#         base_model = model.layers[0]
#         base_model.trainable = True
        
#         # Recompile with lower learning rate for fine-tuning
#         if strategy:
#             with strategy.scope():
#                 model.compile(
#                     optimizer=Adam(learning_rate=0.0001),
#                     loss='categorical_crossentropy',
#                     metrics=['accuracy']
#                 )
#         else:
#             model.compile(
#                 optimizer=Adam(learning_rate=0.0001),
#                 loss='categorical_crossentropy',
#                 metrics=['accuracy']
#             )
        
#         if strategy:
#             with strategy.scope():
#                 history_fine = model.fit(
#                     train_generator,
#                     epochs=10,
#                     validation_data=val_generator,
#                     callbacks=callbacks,
#                     verbose=1
#                 )
#         else:
#             history_fine = model.fit(
#                 train_generator,
#                 epochs=10,
#                 validation_data=val_generator,
#                 callbacks=callbacks,
#                 verbose=1
#             )
        
#         # Evaluate on validation set
#         val_loss, val_accuracy = model.evaluate(val_generator)
#         print(f"✅ Validation accuracy: {val_accuracy:.4f}")
        
#         # Evaluate on test set
#         test_loss, test_accuracy = model.evaluate(test_generator)
#         print(f"✅ Test accuracy: {test_accuracy:.4f}")
        
#         # Save the model
#         os.makedirs('ml-backend/saved_models', exist_ok=True)
#         model_path = os.path.join('ml-backend', 'saved_models', 'cnn_soil_model.h5')
#         model.save(model_path)
        
#         print(f"✅ Model saved to {model_path}")
#         return model, test_accuracy
        
#     except Exception as e:
#         print(f"❌ Error training CNN model: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise

# if __name__ == "__main__":
#     # Check if TensorFlow can access the GPU
#     print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))
    
#     # Enable GPU memory growth
#     gpus = tf.config.experimental.list_physical_devices('GPU')
#     if gpus:
#         try:
#             for gpu in gpus:
#                 tf.config.experimental.set_memory_growth(gpu, True)
#         except RuntimeError as e:
#             print(e)
    
#     # Train the model
#     train_cnn_model()

#-----------

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from torch.optim.lr_scheduler import ReduceLROnPlateau
import os
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score
import time

# Configure GPU for optimal performance
def configure_gpu():
    """Configure GPU settings for PyTorch"""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"✅ GPU detected: {torch.cuda.get_device_name(0)}")
        print(f"✅ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        
        # Set CuDNN benchmark for better performance
        torch.backends.cudnn.benchmark = True
        return device
    else:
        device = torch.device("cpu")
        print("⚠️  No GPU detected. Using CPU instead.")
        return device

# Custom dataset class
class SoilDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.classes = sorted(os.listdir(root_dir))
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        self.images = []
        
        # Load image paths and labels
        for cls_name in self.classes:
            cls_dir = os.path.join(root_dir, cls_name)
            if os.path.isdir(cls_dir):
                for img_name in os.listdir(cls_dir):
                    if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                        self.images.append((os.path.join(cls_dir, img_name), self.class_to_idx[cls_name]))
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path, label = self.images[idx]
        
        # Load image
        image = Image.open(img_path).convert('RGB')  # Ensure 3 channels
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

# Create CNN model for soil classification
def create_cnn_model(num_classes=4, device='cpu'):
    """Create CNN model for soil classification using EfficientNet"""
    # Load pre-trained EfficientNet
    model = models.efficientnet_b0(pretrained=True)
    
    # Freeze early layers for transfer learning
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace the classifier head
    num_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.BatchNorm1d(512),
        nn.Dropout(p=0.5),
        nn.Linear(512, num_classes)
    )
    
    # Move model to appropriate device
    model = model.to(device)
    
    return model

# Training function
def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, device, num_epochs=30):
    """Train the model"""
    train_losses = []
    val_losses = []
    val_accuracies = []
    
    best_acc = 0.0
    best_model_wts = None
    
    for epoch in range(num_epochs):
        print(f'Epoch {epoch+1}/{num_epochs}')
        print('-' * 10)
        
        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        # Use mixed precision for faster training on GPU
        if device.type == 'cuda':
            scaler = torch.cuda.amp.GradScaler()
        
        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            if device.type == 'cuda':
                # Mixed precision training
                with torch.cuda.amp.autocast():
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
            
            # Statistics
            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
        
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = running_corrects.double() / len(train_loader.dataset)
        
        print(f'Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
        
        # Validation phase
        model.eval()
        running_loss = 0.0
        running_corrects = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                _, preds = torch.max(outputs, 1)
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
        
        val_loss = running_loss / len(val_loader.dataset)
        val_acc = running_corrects.double() / len(val_loader.dataset)
        
        print(f'Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}')
        
        # Step the scheduler
        if scheduler:
            scheduler.step(val_loss)
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            best_model_wts = model.state_dict().copy()
        
        # Store metrics
        train_losses.append(epoch_loss)
        val_losses.append(val_loss)
        val_accuracies.append(val_acc.cpu().numpy())
    
    # Load best model weights
    model.load_state_dict(best_model_wts)
    
    return model, train_losses, val_losses, val_accuracies

# Fine-tuning function
def fine_tune_model(model, train_loader, val_loader, criterion, optimizer, scheduler, device, num_epochs=10):
    """Fine-tune the model by unfreezing some layers"""
    print("🔄 Starting fine-tuning phase...")
    
    # Unfreeze all layers for fine-tuning
    for param in model.parameters():
        param.requires_grad = True
    
    # Use a lower learning rate for fine-tuning
    for param_group in optimizer.param_groups:
        param_group['lr'] = 0.0001
    
    # Train with all layers unfrozen
    model, _, _, _ = train_model(model, train_loader, val_loader, criterion, 
                                optimizer, scheduler, device, num_epochs)
    
    return model

# Evaluation function
def evaluate_model(model, test_loader, device):
    """Evaluate the model on test data"""
    model.eval()
    running_corrects = 0
    
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            
            running_corrects += torch.sum(preds == labels.data)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    test_acc = running_corrects.double() / len(test_loader.dataset)
    print(f'✅ Test Accuracy: {test_acc:.4f}')
    
    return test_acc, all_preds, all_labels

def train_cnn_model():
    """Train CNN model for soil image classification"""
    try:
        # Configure device
        device = configure_gpu()
        
        # Dataset paths
        dataset_dir = os.path.join('ml-backend', 'data', 'Dataset')
        train_dir = os.path.join(dataset_dir, 'Train')
        test_dir = os.path.join(dataset_dir, 'test')
        
        if not os.path.exists(train_dir):
            print(f"❌ Training directory not found: {train_dir}")
            return None
        if not os.path.exists(test_dir):
            print(f"❌ Test directory not found: {test_dir}")
            return None
        
        # Data transformations
        train_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        test_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Create datasets
        train_dataset = SoilDataset(train_dir, transform=train_transform)
        test_dataset = SoilDataset(test_dir, transform=test_transform)
        
        # Split train into train and validation
        train_size = int(0.8 * len(train_dataset))
        val_size = len(train_dataset) - train_size
        train_subset, val_subset = torch.utils.data.random_split(
            train_dataset, [train_size, val_size])
        
        # Create data loaders
        batch_size = 32
        train_loader = DataLoader(train_subset, batch_size=batch_size, 
                                 shuffle=True, num_workers=4, pin_memory=True)
        val_loader = DataLoader(val_subset, batch_size=batch_size, 
                               shuffle=False, num_workers=4, pin_memory=True)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, 
                                shuffle=False, num_workers=4, pin_memory=True)
        
        print(f"Training samples: {len(train_subset)}")
        print(f"Validation samples: {len(val_subset)}")
        print(f"Test samples: {len(test_dataset)}")
        print(f"Number of classes: {len(train_dataset.classes)}")
        print(f"Classes: {train_dataset.classes}")
        
        # Create model
        model = create_cnn_model(num_classes=len(train_dataset.classes), device=device)
        
        # Define loss function and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.2, patience=5, verbose=True)
        
        # Display model summary
        print(model)
        
        # Train the model
        print("🚀 Starting training...")
        start_time = time.time()
        
        model, train_losses, val_losses, val_accuracies = train_model(
            model, train_loader, val_loader, criterion, optimizer, scheduler, device, num_epochs=30)
        
        # Fine-tune the model
        model = fine_tune_model(model, train_loader, val_loader, criterion, 
                               optimizer, scheduler, device, num_epochs=10)
        
        training_time = time.time() - start_time
        print(f"✅ Training completed in {training_time//60:.0f}m {training_time%60:.0f}s")
        
        # Evaluate on test set
        test_acc, all_preds, all_labels = evaluate_model(model, test_loader, device)
        
        # Save the model
        os.makedirs('ml-backend/saved_models', exist_ok=True)
        model_path = os.path.join('ml-backend', 'saved_models', 'pytorch_soil_model.pth')
        
        # Save both model and class information
        torch.save({
            'model_state_dict': model.state_dict(),
            'class_to_idx': train_dataset.class_to_idx,
            'classes': train_dataset.classes
        }, model_path)
        
        print(f"✅ Model saved to {model_path}")
        return model, test_acc
        
    except Exception as e:
        print(f"❌ Error training CNN model: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    # Train the model
    model, test_accuracy = train_cnn_model()