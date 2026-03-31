# app/models.py
import os
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./itisweblibrary.db")

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement="auto")
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    otp = Column(String, nullable=True)
    otp_timestamp = Column(DateTime, nullable=True)

def get_all_users(db: Session):
    return db.query(User).all()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)