from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud, youtube_utils
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="YouTube Course Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/videos", response_model=schemas.VideoResponse)
async def add_or_update_video(request: schemas.VideoCreateRequest, db: Session = Depends(get_db)):
    try:
        info = youtube_utils.extract_youtube_info(request.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    final_timestamp = info["timestamp_sec"]
    if request.manual_time:
        manual_sec = youtube_utils.parse_time_to_seconds(request.manual_time)
        if manual_sec > 0:
            final_timestamp = manual_sec

    metadata = await youtube_utils.fetch_youtube_metadata(info["youtube_id"])
    
    # Asignar categoría automática si no viene definida
    detected_cat = request.category if (request.category and request.category != "General") else youtube_utils.auto_detect_category(metadata["title"])

    video = crud.upsert_video(
        db=db,
        youtube_id=info["youtube_id"],
        title=metadata["title"],
        channel_name=metadata["channel_name"],
        thumbnail_url=metadata["thumbnail_url"],
        timestamp_sec=final_timestamp,
        category=detected_cat
    )
    return video

@app.get("/api/videos", response_model=List[schemas.VideoResponse])
def list_videos(status: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Video)
    if status:
        query = query.filter(models.Video.status == status)
    if category:
        query = query.filter(models.Video.category == category)
    return query.order_by(models.Video.last_watched_at.desc()).all()

@app.patch("/api/videos/{video_id}/progress", response_model=schemas.VideoResponse)
def update_progress(video_id: int, data: schemas.VideoProgressUpdate, db: Session = Depends(get_db)):
    video = crud.update_video_progress(db, video_id, data)
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return video

@app.delete("/api/videos/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    db.delete(video)
    db.commit()
    return {"ok": True, "message": "Video eliminado"}

@app.post("/api/videos/{video_id}/notes", response_model=schemas.NoteResponse)
def add_note(video_id: int, note_data: schemas.NoteCreate, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    new_note = models.Note(
        video_id=video_id,
        timestamp_sec=note_data.timestamp_sec,
        content=note_data.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    db.delete(note)
    db.commit()
    return {"ok": True}