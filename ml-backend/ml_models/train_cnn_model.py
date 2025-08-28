import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import numpy as np
import os

def create_cnn_model(input_shape=(224, 224, 3), num_classes=6):
    """Create CNN model for soil classification"""
    # Use EfficientNetB0 as base model
    base_model = EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=input_shape,
        pooling='avg'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Add custom layers
    model = keras.Sequential([
        base_model,
        layers.Dropout(0.3),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def train_cnn_model():
    """Train CNN model for soil image classification"""
    try:
        # Data directories
        train_dir = os.path.join('data', 'soil_images', 'train')
        val_dir = os.path.join('data', 'soil_images', 'validation')
        
        # Check if data exists
        if not os.path.exists(train_dir):
            print(f"Training directory not found: {train_dir}")
            return None
        
        # Data augmentation and preprocessing
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest'
        )
        
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Create data generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(224, 224),
            batch_size=32,
            class_mode='categorical',
            shuffle=True
        )
        
        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=(224, 224),
            batch_size=32,
            class_mode='categorical',
            shuffle=False
        )
        
        print(f"Training classes: {train_generator.class_indices}")
        print(f"Validation classes: {val_generator.class_indices}")
        
        # Create model
        model = create_cnn_model(num_classes=len(train_generator.class_indices))
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Callbacks
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ReduceLROnPlateau(factor=0.2, patience=5)
        ]
        
        # Train model
        history = model.fit(
            train_generator,
            epochs=50,
            validation_data=val_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Fine-tuning: Unfreeze base model
        base_model = model.layers[0]
        base_model.trainable = True
        
        # Recompile with lower learning rate
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Fine-tune
        history_fine = model.fit(
            train_generator,
            epochs=20,
            validation_data=val_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate model
        val_loss, val_accuracy = model.evaluate(val_generator)
        print(f"Validation accuracy: {val_accuracy:.4f}")
        
        # Save model
        os.makedirs('models', exist_ok=True)
        model_path = os.path.join('models', 'cnn_soil_model.h5')
        model.save(model_path)
        
        print(f"Model saved to {model_path}")
        
        return model, val_accuracy
        
    except Exception as e:
        print(f"Error training CNN model: {str(e)}")
        raise

if __name__ == "__main__":
    train_cnn_model()