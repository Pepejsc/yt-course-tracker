import { useState, useEffect } from "react";
import {
  PlusCircle,
  PlaySquare,
  ArrowLeft,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import YouTube from "react-youtube";
import {
  getVideos,
  updateProgress,
  addNote,
  deleteNote,
  deleteVideo,
} from "./services/api";

const formatTime = (totalSeconds) => {
  if (!totalSeconds) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function App() {
  const [url, setUrl] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Estado para alertas elegantes en lugar de alert() nativo
  const [errorMessage, setErrorMessage] = useState(null);

  // Estado para el modal de confirmación de borrado
  const [videoToDelete, setVideoToDelete] = useState(null);

  // Estados Modo Cine
  const [activeVideo, setActiveVideo] = useState(null);
  const [player, setPlayer] = useState(null);
  const [newNote, setNewNote] = useState("");

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const loadVideos = () => {
    getVideos()
      .then(setVideos)
      .catch((err) => triggerError(err.message));
  };

useEffect(() => {
    loadVideos();

    // Recargar automáticamente la lista cuando el usuario regresa a la pestaña de la app
    const handleFocus = () => {
      loadVideos();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [],);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al guardar el video");
      }
      setUrl("");
      loadVideos();
    } catch (error) {
      triggerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      await deleteVideo(videoToDelete.id);
      setVideoToDelete(null);
      loadVideos();
    } catch (error) {
      triggerError(error.message);
    }
  };

  const handleToggleComplete = async (video) => {
    const isNowCompleted = video.status === "completed";
    const targetStatusTime = isNowCompleted
      ? 0
      : video.total_duration_sec || video.current_time_sec || 100;
    try {
      await updateProgress(
        video.id,
        targetStatusTime,
        video.total_duration_sec,
      );
      loadVideos();
    } catch (error) {
      triggerError(error.message);
    }
  };

  const handlePlayerPause = async (event) => {
    if (!activeVideo) return;
    const currentTime = event.target.getCurrentTime();
    const totalTime = event.target.getDuration();
    try {
      await updateProgress(activeVideo.id, currentTime, totalTime);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !player) return;
    const currentTime = player.getCurrentTime();
    try {
      await addNote(activeVideo.id, currentTime, newNote);
      setNewNote("");
      const updatedList = await getVideos();
      setVideos(updatedList);
      setActiveVideo(updatedList.find((v) => v.id === activeVideo.id));
    } catch (error) {
      triggerError(error.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      const updatedList = await getVideos();
      setVideos(updatedList);
      setActiveVideo(updatedList.find((v) => v.id === activeVideo.id));
    } catch (error) {
      triggerError(error.message);
    }
  };

  const jumpToTime = (seconds) => {
    if (player) {
      player.seekTo(seconds, true);
      player.playVideo();
    }
  };

  const filteredVideos = videos.filter((v) => {
    if (activeFilter === "watching") return v.status !== "completed";
    if (activeFilter === "completed") return v.status === "completed";
    return true;
  });

  // --- Vista Modo Cine ---
  if (activeVideo) {
    const sortedNotes =
      activeVideo.notes?.sort((a, b) => a.timestamp_sec - b.timestamp_sec) ||
      [];

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="p-4 flex items-center justify-between bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveVideo(null);
                setPlayer(null);
                loadVideos();
              }}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
            </button>
            <h2 className="text-lg font-semibold truncate max-w-xl text-gray-200">
              {activeVideo.title}
            </h2>
          </div>
        </header>

        <div className="flex-1 w-full flex flex-col lg:flex-row h-[calc(100vh-73px)]">
          <div className="flex-1 p-4 flex flex-col items-center bg-black overflow-y-auto">
            <div className="w-full max-w-5xl aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              <YouTube
                videoId={activeVideo.youtube_id}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 1,
                    start: activeVideo.current_time_sec,
                  },
                }}
                onReady={(e) => setPlayer(e.target)}
                onPause={handlePlayerPause}
                onEnd={handlePlayerPause}
                className="w-full h-full"
              />
            </div>
            <p className="mt-4 text-gray-500 text-xs">
              Tu progreso se guarda automáticamente cada vez que pausas el
              video.
            </p>
          </div>

          <div className="w-full lg:w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 bg-gray-800/50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Apuntes del Curso
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedNotes.length === 0 ? (
                <p className="text-gray-500 text-center text-xs mt-10">
                  Sin notas aún. Escribe abajo para guardar ideas con la marca
                  de tiempo.
                </p>
              ) : (
                sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gray-800 p-3 rounded-lg border border-gray-700 group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <button
                        onClick={() => jumpToTime(note.timestamp_sec)}
                        className="text-red-400 font-mono text-xs bg-red-500/10 px-2 py-0.5 rounded hover:bg-red-500/20"
                      >
                        [{formatTime(note.timestamp_sec)}]
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddNote}
              className="p-4 border-t border-gray-800 bg-gray-900"
            >
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe un apunte aquí..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-500 resize-none h-20 mb-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold py-2 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
              >
                Guardar Apunte
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans relative">
      {/* AVISO / TOAST FLOTANTE ELEGANTE EN LUGAR DE ALERT */}
      {errorMessage && (
        <div className="fixed top-5 right-5 z-50 bg-red-950/90 border border-red-500 text-red-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-medium">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <header className="bg-gray-900 border-b border-gray-800 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlaySquare className="text-red-500 w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">
              YT Course Tracker
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Formulario e Inputs Responsivos */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega la URL del curso de YouTube..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar Curso"}
          </button>
        </form>

        {/* Filtros Scrollables en pantallas pequeñas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === "all" ? "bg-red-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}
          >
            Todos ({videos.length})
          </button>
          <button
            onClick={() => setActiveFilter("watching")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === "watching" ? "bg-red-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}
          >
            En Curso ({videos.filter((v) => v.status !== "completed").length})
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === "completed" ? "bg-red-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}
          >
            Completados ({videos.filter((v) => v.status === "completed").length}
            )
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex flex-col group"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className={`w-full h-full object-cover transition-opacity ${video.status === "completed" ? "opacity-40 grayscale" : "opacity-85"}`}
                />
                <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-0.5 rounded text-xs font-mono border border-gray-700">
                  {formatTime(video.current_time_sec)}
                </div>
                {video.status === "completed" && (
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completado
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3
                    className="font-semibold text-sm line-clamp-2 leading-tight"
                    title={video.title}
                  >
                    {video.title}
                  </h3>
                  <button
                    onClick={() => setVideoToDelete(video)}
                    title="Eliminar curso"
                    className="text-gray-500 hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs mb-4 truncate">
                  {video.channel_name}
                </p>

                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 bg-gray-800 rounded text-gray-300">
                      {video.category}
                    </span>
                    <button
                      onClick={() => handleToggleComplete(video)}
                      title={
                        video.status === "completed"
                          ? "Marcar como pendiente"
                          : "Marcar como completado"
                      }
                      className={`text-xs ${video.status === "completed" ? "text-emerald-500" : "text-gray-500 hover:text-emerald-400"}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveVideo(video)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <PlaySquare className="w-3.5 h-3.5" /> Reanudar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* POPUP DE CONFIRMACIÓN */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                ¿Eliminar este curso?
              </h3>
            </div>

            <p className="text-gray-300 text-sm mb-2 font-medium line-clamp-2">
              "{videoToDelete.title}"
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Esta acción no se puede deshacer. Se borrará tu progreso y todos
              los apuntes vinculados a este video.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setVideoToDelete(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteVideo}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
