# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import os
import random
import string
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from .models import SessionLocal, User, engine, get_all_users
from .utils import send_email
import hashlib


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

pwd_context = CryptContext(schemes=["argon2"])

# Add a secret key for JWT signing
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
temp_storage = {}

class OTPData(BaseModel):
    email: str
    otp: str


def compute_md5(file_path):
    md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(4096):
            md5.update(chunk)
    return md5.hexdigest()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@app.post("/signup")
async def signup(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # Check if the user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered. Please Login.")

    # Generate OTP and send it to the user's email
    otp = generate_otp()
    otp_timestamp = datetime.utcnow()
    subject = "Your OTP Code"
    body = f"Your OTP code is {otp}. It is valid for 5 minutes."
    send_email(email, subject, body)

    # Store OTP and timestamp in a temporary storage (e.g., in-memory dictionary)
    # This is a simple example; in a real application, consider using a more robust solution
    temp_storage[email] = {"otp": otp, "otp_timestamp": otp_timestamp, "password": password}

    return {"message": "OTP sent to email"}


@app.post("/verify-otp")
async def verify_otp(data: OTPData, db: Session = Depends(get_db)):
    # Retrieve OTP and timestamp from temporary storage
    temp_data = temp_storage.get(data.email)
    if not temp_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP or OTP expired")

    stored_otp = temp_data["otp"]
    otp_timestamp = temp_data["otp_timestamp"]
    password = temp_data["password"]

    # Verify OTP and timestamp
    if stored_otp == data.otp and (datetime.utcnow() - otp_timestamp).seconds < 300:
        # Create the user in the database
        hashed_password = pwd_context.hash(password)
        user = User(email=data.email, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Clear OTP from temporary storage
        del temp_storage[data.email]

        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP or OTP expired")


@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user and verify_password(password, user.hashed_password):
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email or password")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/home", response_class=HTMLResponse)
async def read_home(request: Request, db: Session = Depends(get_db)):
    users = get_all_users(db)
    return templates.TemplateResponse("home.html", {"request": request, "users": users})

@app.get("/download/{file_name}")
async def download_file(file_name: str):
    file_path = f"static/{file_name}"
    md5_checksum = compute_md5(file_path)
    return {"file_url": f"/static/{file_name}", "md5_checksum": md5_checksum}

@app.post("/forgot-password")
async def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Generate a reset token and send it to the user's email
    reset_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=15))
    reset_link = f"{BASE_URL}/reset-password?token={reset_token}"
    subject = "Reset Your Password"
    body = f"Click the following link to reset your password: {reset_link}"
    send_email(email, subject, body)

    return {"message": "Password reset link sent to email"}

@app.get("/reset-password", response_class=HTMLResponse)
async def reset_password_form(request: Request, token: str):
    return templates.TemplateResponse("reset_password.html", {"request": request, "token": token})

@app.post("/reset-password")
async def reset_password(token: str = Form(...), new_password: str = Form(...), confirm_password: str = Form(...), db: Session = Depends(get_db)):
    if new_password != confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(new_password)
    db.commit()

    return RedirectResponse(url="/reset-password-success", status_code=status.HTTP_200_OK)

@app.get("/reset-password-success", response_class=HTMLResponse)
async def reset_password_success(request: Request):
    return templates.TemplateResponse("reset_password_success.html", {"request": request})