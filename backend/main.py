
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth, users, speakers, bookings, advisory, briefings, keywords
from backend.database.session import engine, Base
from backend.database import models

# Create Tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_db_seed():
    from backend.database.session import SessionLocal
    from backend.api.auth import get_password_hash
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.email == "admin@boardroomclub.com").first():
            print("Seeding initial administrator and test user...")
            admin = models.User(name="Admin", email="admin@boardroomclub.com", password_hash=get_password_hash("admin123"), role="admin")
            test = models.User(name="KJ Byun", email="kjbyun@foundersstud.io", password_hash=get_password_hash("password123"), role="member")
            db.add_all([admin, test])
            db.commit()
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

app = FastAPI(
    title="Boardroom Club API",
    version="1.0.0",
    description="AI-Native Speaker Management API"
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://kankl-boardroom-club-1771850475.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(speakers.router, prefix="/api/v1/speakers", tags=["speakers"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["bookings"])
app.include_router(advisory.router, prefix="/api/v1/advisory", tags=["advisory"])
app.include_router(briefings.router, prefix="/api/v1/briefings", tags=["briefings"])
app.include_router(keywords.router, prefix="/api/v1/keywords", tags=["keywords"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
# Force reload for keywords endpoint
