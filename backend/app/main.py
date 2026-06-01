from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, matches, messages, ideas

app = FastAPI(title="StartupMatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",     tags=["Auth"])
app.include_router(users.router,    prefix="/users",    tags=["Users"])
app.include_router(matches.router,  prefix="/matches",  tags=["Matches"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(ideas.router,    prefix="/ideas",    tags=["Ideas"])


@app.get("/")
def root():
    return {"status": "ok", "app": "StartupMatch API"}

@app.get("/ping")
def ping():
    return "pong"
