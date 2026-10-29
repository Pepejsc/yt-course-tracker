import re
from urllib.parse import urlparse, parse_qs
import httpx

def parse_time_to_seconds(time_str: str) -> int:
    """
    Convierte formatos como '1h2m10s', '45m30s', '120s', '120' o '01:15:20' a segundos enteros.
    """
    if not time_str:
        return 0
    
    time_str = str(time_str).strip().lower()

    # Caso 1: Número puro o número con 's' al final (ej. "452" o "452s")
    if re.match(r"^\d+s?$", time_str):
        return int(time_str.replace("s", ""))

    # Caso 2: Formato reloj manual "MM:SS" o "HH:MM:SS" (por si el usuario lo escribe a mano)
    if ":" in time_str:
        parts = [int(p) for p in time_str.split(":") if p.isdigit()]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]

    # Caso 3: Formato YouTube complejo (ej. "1h20m5s")
    hours = re.search(r"(\d+)h", time_str)
    minutes = re.search(r"(\d+)m", time_str)
    seconds = re.search(r"(\d+)s", time_str)

    total_seconds = 0
    if hours:
        total_seconds += int(hours.group(1)) * 3600
    if minutes:
        total_seconds += int(minutes.group(1)) * 60
    if seconds:
        total_seconds += int(seconds.group(1))

    return total_seconds


def extract_youtube_info(url: str) -> dict:
    """
    Extrae el youtube_id (11 caracteres) y el timestamp en segundos desde cualquier URL de YouTube.
    """
    parsed_url = urlparse(url.strip())
    query_params = parse_qs(parsed_url.query)
    
    video_id = None

    # 1. Extraer el ID del video según el tipo de URL
    if parsed_url.hostname in ["youtu.be", "www.youtu.be"]:
        video_id = parsed_url.path.lstrip("/").split("/")[0]
    elif "youtube.com" in (parsed_url.hostname or ""):
        if parsed_url.path == "/watch":
            video_id = query_params.get("v", [None])[0]
        elif parsed_url.path.startswith(("/embed/", "/v/", "/shorts/")):
            video_id = parsed_url.path.split("/")[2]

    # Validación estricta: el ID de YouTube siempre tiene 11 caracteres válidos
    if not video_id or not re.match(r"^[a-zA-Z0-9_-]{11}$", video_id):
        raise ValueError("URL de YouTube no válida o no se pudo encontrar el ID del video.")

    # 2. Extraer el tiempo si viene en '?t=' o '?start=' o en el fragmento '#t='
    raw_time = query_params.get("t", query_params.get("start", [None]))[0]
    if not raw_time and parsed_url.fragment.startswith("t="):
        raw_time = parsed_url.fragment.replace("t=", "")

    timestamp_sec = parse_time_to_seconds(raw_time)

    return {
        "youtube_id": video_id,
        "timestamp_sec": timestamp_sec
    }


async def fetch_youtube_metadata(youtube_id: str) -> dict:
    """
    Obtiene el título, nombre del canal y miniatura usando el endpoint público oEmbed de YouTube.
    No requiere API Key.
    """
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={youtube_id}&format=json"
    thumbnail_hq = f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(oembed_url)
        if response.status_code == 200:
            data = response.json()
            return {
                "title": data.get("title", f"Video {youtube_id}"),
                "channel_name": data.get("author_name", "Canal desconocido"),
                "thumbnail_url": data.get("thumbnail_url", thumbnail_hq)
            }
        else:
            # Fallback si el video tiene deshabilitado el oEmbed pero sí existe
            return {
                "title": f"Curso de YouTube ({youtube_id})",
                "channel_name": "YouTube",
                "thumbnail_url": thumbnail_hq
            }
            
def auto_detect_category(title: str) -> str:
    """Detecta la categoría analizando palabras clave en el título del video."""
    title_lower = title.lower()

    rules = {
        "Python": ["python", "django", "fastapi", "pandas", "numpy", "flask"],
        "SQL": ["sql", "mysql", "postgres", "database", "base de datos", "sqlite"],
        "JavaScript": ["javascript", "js", "react", "vue", "node", "typescript", "angular"],
        "DevOps": ["docker", "kubernetes", "aws", "linux", "git", "ci/cd"],
        "Inglés": ["english", "inglés", "ingles", "listening", "speaking", "grammar"],
    }

    for category, keywords in rules.items():
        if any(keyword in title_lower for keyword in keywords):
            return category

    return "General"