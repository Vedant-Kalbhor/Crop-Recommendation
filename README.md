# 🌾 Crop Recommendation System

A **Full-Stack AI-Powered Web Application** that recommends the most suitable crop based on **soil parameters, soil images, and regional conditions**.  
This project integrates **Machine Learning (FastAPI)**, **Backend APIs (Node.js/Express)**, and a **React.js Frontend** to provide intelligent, data-driven agricultural insights.

---

## 🚀 Features

### 👩‍🌾 User Features
- **User Authentication:** Secure login and registration (JWT-based authentication).
- **Crop Recommendation (3 Modes):**
  1. **Soil Parameters Mode** — Input N, P, K, temperature, humidity, pH, and rainfall to get suitable crops.
  2. **Soil Image Mode** — Upload an image of the soil to classify type (e.g., Clay, Sandy, Loamy) and get crop suggestions.
  3. **Region Mode** — Select your region to get crops based on local weather and soil trends.
- **Weather Integration:** Real-time weather data fetched using external APIs.
- **User Feedback System:** Users can mark recommendations as "useful" or "not useful."
- **Dashboard:** View history of recommendations, status updates, and analytics.

### 🧠 Machine Learning
- **Random Forest Model:** Predicts best crop based on soil parameters.
- **CNN Soil Image Model:** Classifies soil images into categories.
- **Region-based Model:** Suggests crops suited for specific geographical regions.
- Models built and served via **FastAPI** backend with endpoints integrated into the main Node.js API.

### 📊 Analytics & Insights
- Track user trends, useful crop suggestions, and feedback analytics.
- Visualized data available for admin and user dashboards.

---

## 🧩 Tech Stack

### 🖥️ Frontend
- **React.js** with Hooks & Context API
- **Axios** for API communication
- **Tailwind CSS / Custom CSS** for UI design
- **React Router** for navigation

### ⚙️ Backend (API Server)
- **Node.js** + **Express.js**
- **MongoDB** with **Mongoose**
- **JWT Authentication**
- RESTful API architecture

### 🧬 Machine Learning Backend
- **FastAPI** (Python)
- **PyTorch / TensorFlow** for CNN soil image model
- **Scikit-Learn** for Random Forest crop prediction
- **Pandas, NumPy, OpenCV** for preprocessing
- **Joblib / Pickle** for model persistence

### 🐳 DevOps & Deployment
- **Docker + docker-compose** support
- Compatible with **Render**, **AWS**, or **Vercel** deployments

---
