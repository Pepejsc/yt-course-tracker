# backend/app/crud.py
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from . import models, schemas

def calculate_status(current_sec: int, total_sec: int) -> str:
    if current_sec <= 0:
        return "pending"
    if total_sec > 0 and (current_sec / total_sec) >= 0.95:
        return "completed"
    return "watching"


def upsert_video(db: Session, youtube_id: str, title: str, channel_name: str, thumbnail_url: str, timestamp_sec: int, category: str):
    existing_video = db.query(models.Video).filter(models.Video.youtube_id == youtube_id).first()
    
    if existing_video:
        # Actualizamos metadatos generales
        existing_video.title = title
        existing_video.channel_name = channel_name
        existing_video.thumbnail_url = thumbnail_url
        existing_video.category = category
        
        # Lógica inteligente: solo actualizamos el tiempo si el marcador enviado es mayor 
        # o si el video estaba en 0, evitando que un enlace sin ?t= borre tu progreso avanzado.
        if timestamp_sec > existing_video.current_time_sec:
            existing_video.current_time_sec = timestamp_sec
            
        db.commit()
        db.refresh(existing_video)
        return existing_video
    else:
        new_video = models.Video(
            youtube_id=youtube_id,
            title=title,
            channel_name=channel_name,
            thumbnail_url=thumbnail_url,
            current_time_sec=timestamp_sec,
            category=category,
            status="watching"
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        return new_video


def update_video_progress(db: Session, video_id: int, update_data: schemas.VideoProgressUpdate) -> models.Video | None:
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        return None

    video.current_time_sec = max(0, update_data.current_time_sec)
    if update_data.total_duration_sec is not None and update_data.total_duration_sec > 0:
        video.total_duration_sec = update_data.total_duration_sec
    if update_data.category:
        video.category = update_data.category

    video.status = calculate_status(video.current_time_sec, video.total_duration_sec)
    video.last_watched_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(video)
    return video