const API_URL = import.meta.env.VITE_API_URL || "https://yt-course-tracker-backend.onrender.com/api";

export const getVideos = async () => {
  const res = await fetch(`${API_URL}/videos`);
  if (!res.ok) throw new Error('Error al obtener los videos');
  return res.json();
};

export const addVideo = async (url) => {
  const res = await fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, category: 'General' }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Error al guardar el video');
  }
  return res.json();
};

export const updateProgress = async (videoId, currentTime, totalDuration) => {
  const res = await fetch(`${API_URL}/videos/${videoId}/progress`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_time_sec: Math.floor(currentTime),
      total_duration_sec: Math.floor(totalDuration || 0)
    }),
  });
  if (!res.ok) throw new Error('Error al actualizar progreso');
  return res.json();
};

export const addNote = async (videoId, timestamp, content) => {
  const res = await fetch(`${API_URL}/videos/${videoId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timestamp_sec: Math.floor(timestamp),
      content: content
    }),
  });
  if (!res.ok) throw new Error('Error al guardar la nota');
  return res.json();
};

// Opcional pero recomendado: Función para borrar notas
export const deleteNote = async (noteId) => {
  const res = await fetch(`${API_URL}/notes/${noteId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar la nota');
  return res.json();
};

export const deleteVideo = async (videoId) => {
  const res = await fetch(`${API_URL}/videos/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar el video');
  return res.json();
};