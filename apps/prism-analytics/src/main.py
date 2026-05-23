"""Prism Analytics API — FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes import leads, kpi, gtm, funnel
from models.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Supabase client connects lazily
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Prism Analytics API",
    description="Analytics pipeline for Syntaxure Labs business data",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(leads.router)
app.include_router(kpi.router)
app.include_router(gtm.router)
app.include_router(funnel.router)


@app.get("/api/v1/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok", "service": "prism-analytics"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
