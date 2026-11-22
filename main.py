"""
FastAPI application entry point.
Run with: uvicorn backend.main:app --reload
"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api.routes import router

app = FastAPI(
    title="Autonomous Multi-Agent Investment System",
    description=(
        "AI-powered investment decision platform using Market, Fundamental, "
        "Risk, Sentiment, and Portfolio agents to produce BUY/HOLD/SELL recommendations."
    ),
    version="1.0.0",
)

# Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analysis router
app.include_router(router)

# Serve frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

