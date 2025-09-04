import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import os

def create_cnn_model(input_shape=(224, 224, 3), num_classes=4):
    """Create CNN model for soil classification"""
    base_model = EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=input_shape,
        pooling='avg'
    )
    
    # Freeze base model
    base_model.trainable = False
    
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
        dataset_dir = os.path.join('ml-backend', 'data', 'CyAUG-Dataset')
        if not os.path.exists(dataset_dir):
            print(f"❌ Dataset directory not found: {dataset_dir}")
            return None

        datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest',
            validation_split=0.2
        )
        
        train_generator = datagen.flow_from_directory(
            dataset_dir,
            target_size=(224, 224),
            batch_size=32,
            class_mode='categorical',
            subset='training',
            shuffle=True
        )
        
        val_generator = datagen.flow_from_directory(
            dataset_dir,
            target_size=(224, 224),
            batch_size=32,
            class_mode='categorical',
            subset='validation',
            shuffle=False
        )
        
        print(f"Training classes: {train_generator.class_indices}")
        print(f"Validation classes: {val_generator.class_indices}")

        NUM_CLASSES = 4  # ✅ Change to 8 later if dataset has 8 classes
        model = create_cnn_model(num_classes=NUM_CLASSES)
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ReduceLROnPlateau(factor=0.2, patience=5)
        ]
        
        history = model.fit(
            train_generator,
            epochs=50,
            validation_data=val_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Fine-tuning
        base_model = model.layers[0]
        base_model.trainable = True
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        history_fine = model.fit(
            train_generator,
            epochs=20,
            validation_data=val_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        val_loss, val_accuracy = model.evaluate(val_generator)
        print(f"✅ Validation accuracy: {val_accuracy:.4f}")
        
        os.makedirs('ml-backend/saved_models', exist_ok=True)
        model_path = os.path.join('ml-backend', 'saved_models', 'cnn_soil_model.h5')
        model.save(model_path)
        
        print(f"✅ Model saved to {model_path}")
        return model, val_accuracy
        
    except Exception as e:
        print(f"❌ Error training CNN model: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    train_cnn_model()
