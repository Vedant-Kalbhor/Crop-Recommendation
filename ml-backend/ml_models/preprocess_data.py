import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os

def preprocess_crop_data():
    try:
        data_path = os.path.join('ml-backend', 'data', 'region_crop_dataset.csv')
        df = pd.read_csv(data_path)

        print("Original dataset info:")
        print(df.head)

        # Expand crops into multiple rows
        df_expanded = df.assign(crops=df['crops'].str.split(',')).explode('crops').reset_index(drop=True)
        df_expanded.rename(columns={'crops': 'label'}, inplace=True)

        print("\nExpanded dataset:")
        print(df_expanded)

        
        label_encoder = LabelEncoder()
        df_expanded['label_encoded'] = label_encoder.fit_transform(df_expanded['label'])

        # Save encoder
        os.makedirs(os.path.join('ml-backend','saved_models'), exist_ok=True)
        encoder_path = os.path.join('ml-backend','saved_models', 'label_encoders.pkl')
        joblib.dump(label_encoder, encoder_path)

        print(f"\nLabel encoder saved to {encoder_path}")
        print(f"Classes: {label_encoder.classes_}")

        return df_expanded, label_encoder

    except Exception as e:
        print(f"Error preprocessing data: {str(e)}")
        raise

def create_region_dataset():
    """Create region-based crop recommendation dataset"""
    try:
        
        #sample self dataset
        
        region_data = {
            'region': [
                'north', 'north', 'north', 'north',
                'south', 'south', 'south', 'south',
                'east', 'east', 'east', 'east',
                'west', 'west', 'west', 'west',
                'central', 'central', 'central'
            ],
            'crops': [
                'Wheat,Barley,Mustard,Potato',
                'Rice,Sugarcane,Maize,Pulse',
                'Cotton,Groundnut,Soybean,Sunflower',
                'Fruits,Vegetables,Spices',
                'Rice,Coconut,Spices,Rubber',
                'Coffee,Tea,Cardamom,Pepper',
                'Cotton,Sugarcane,Groundnut',
                'Millets,Pulses,Oilseeds',
                'Rice,Jute,Tea,Sugarcane',
                'Potato,Wheat,Maize,Pulse',
                'Fruits,Vegetables,Spices',
                'Oilseeds,Pulses,Cereals',
                'Cotton,Sugarcane,Groundnut',
                'Wheat,Barley,Mustard',
                'Fruits,Vegetables,Spices',
                'Coffee,Tea,Spices',
                'Wheat,Soybean,Chickpea',
                'Rice,Pulse,Oilseeds',
                'Cotton,Sugarcane,Maize'
            ]
        }
        
        df_region = pd.DataFrame(region_data)
        
        # Save region dataset
        os.makedirs('data', exist_ok=True)
        region_path = os.path.join('ml-backend','data', 'region_crop_dataset.csv')
        df_region.to_csv(region_path, index=False)
        
        print(f"Region dataset created with {len(df_region)} rows")
        print(f"Saved to {region_path}")
        
        return df_region
        
    except Exception as e:
        print(f"Error creating region dataset: {str(e)}")
        raise

if __name__ == "__main__":
    create_region_dataset()
    preprocess_crop_data()
    