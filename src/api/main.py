from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes.api import api_router
from fastapi.responses import HTMLResponse

app = FastAPI(title="Burn after reading message")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Include API routes
app.include_router(api_router)

@app.get("/")
async def read_root():
    return {"status": "ok"}

@app.get("/success")
async def success_page():
    with open("src/success.html") as f:
        content = f.read()
    return HTMLResponse(content=content)