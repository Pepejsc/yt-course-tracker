# backend/app/schemas.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# --- Esquemas para Notas ---
class NoteCreate(BaseModel):
    timestamp_sec: int
    content: str

class NoteResponse(BaseModel):
    id: int
    video_id: int
    timestamp_sec: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Esquemas para Videos ---
class VideoCreateRequest(BaseModel):
    url: str
    category: Optional[str] = "General"
    manual_time: Optional[str] = None  # Ej: "15:30" o "1h20m" si el link no trae ?t=

class VideoProgressUpdate(BaseModel):
    current_time_sec: int
    total_duration_sec: Optional[int] = None
    category: Optional[str] = None

class VideoResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    channel_name: str
    thumbnail_url: str
    current_time_sec: int
    total_duration_sec: int
    category: str
    status: str
    created_at: datetime
    last_watched_at: datetime
    notes: List[NoteResponse] = []

    model_config = ConfigDict(from_attributes=True)