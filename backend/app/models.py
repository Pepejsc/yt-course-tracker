# backend/app/models.py
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String(11), unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    channel_name = Column(String, default="Canal de YouTube")
    thumbnail_url = Column(String, nullable=False)
    
    current_time_sec = Column(Integer, default=0)
    total_duration_sec = Column(Integer, default=0)
    
    category = Column(String, default="General", index=True)
    status = Column(String, default="pending")  # pending | watching | completed
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_watched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación 1 a Muchos con las notas
    notes = relationship("Note", back_populates="video", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    timestamp_sec = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    video = relationship("Video", back_populates="notes")