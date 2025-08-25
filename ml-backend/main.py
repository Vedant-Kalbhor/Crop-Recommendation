from fastapi import FastAPI,File,UploadFile,HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image
import io
import os
from datetime import datetime

app = FastAPI(title="Crop Recommendation API")