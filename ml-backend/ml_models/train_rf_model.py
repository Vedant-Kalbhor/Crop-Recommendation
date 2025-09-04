import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_random_forest_model():
    """Train Random Forest model for crop recommendation"""
    try:
        data_path = os.path.join('ml-backend', 'data', 'Crop_recommendation.csv')
        df = pd.read_csv(data_path)

        print(f"Dataset loaded with {len(df)} rows")
        print("Columns:", df.columns.tolist())

        X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
        y = df['label']

        # Create and fit label encoder for crops
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        print(f"Number of unique crops: {len(label_encoder.classes_)}")
        print("Crop classes:", label_encoder.classes_)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42
        )

        print(f"Training samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")

        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10,
            min_samples_split=5,
            n_jobs=-1
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        print(f"Model accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

        # Save both model and label encoder
        os.makedirs(os.path.join('ml-backend', 'saved_models'), exist_ok=True)
        model_path = os.path.join('ml-backend', 'saved_models', 'random_forest_model.pkl')
        #encoder_path = os.path.join('ml-backend', 'saved_models', 'crop_label_encoder.pkl')
        
        joblib.dump(model, model_path)
        #joblib.dump(label_encoder, encoder_path)

        print(f"Model saved to {model_path}")
        #print(f"Label encoder saved to {encoder_path}")

        return model, label_encoder, accuracy

    except Exception as e:
        print(f"Error training model: {str(e)}")
        raise

if __name__ == "__main__":
    train_random_forest_model()