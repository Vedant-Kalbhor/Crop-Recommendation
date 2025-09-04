# ml-backend/utils/model_compatibility.py
import tensorflow as tf
import numpy as np

model_path="ml-backend/saved_models/cnn_soil_model.h5"

def create_compatible_model(input_shape=(224, 224, 3), num_classes=4):
    """Create a CNN model that matches your expected architecture"""
    model = tf.keras.Sequential([
        # First Convolutional Layer
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        tf.keras.layers.MaxPooling2D(2, 2),
        
        # Second Convolutional Layer
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        
        # Third Convolutional Layer
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        
        # Fourth Convolutional Layer
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        
        # Flatten the output
        tf.keras.layers.Flatten(),
        
        # Dense Layers
        tf.keras.layers.Dense(512, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def load_or_create_model(model_path, input_shape=(224, 224, 3), num_classes=4):
    """Load existing model or create a compatible one"""
    try:
        # Try to load the existing model
        model = tf.keras.models.load_model(model_path)
        print(f"Loaded existing model from {model_path}")
        return model
    except:
        # Create a new compatible model
        print(f"Creating new compatible model")
        model = create_compatible_model(input_shape, num_classes)
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        return model