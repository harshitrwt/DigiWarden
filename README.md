# DigiPatron

A system that reconstructs the lifecycle of digital media to detect reused content, understand how it changed, track its spread, and enable takedown actions.

## Overview
This repository contains the dual-stack architecture for ContentGenome v3:
- **Backend**: FastAPI
- **Frontend**: React (Vite)

## Running the Application

### 1. Backend
Navigate to the `backend` directory, install dependencies, and run the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
fastapi dev main.py
# Server will run on http://localhost:8000
```

### 2. Frontend
Navigate to the `frontend` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
# Vite will provide a localhost URL to view the frontend
```

## Next Steps
- Integrate the pHash, ORB, and CLIP models into the `/upload` backend route.
- Enhance the React frontend to display the D3.js propagation graph.
- Implement the Hero simulated dataset.
