# YT Course Tracker

Aplicación web full-stack para gestionar, organizar y dar seguimiento al progreso de cursos y tutoriales de YouTube desde un solo lugar. Permite guardar videos, registrar el progreso de reproducción, tomar apuntes con marcas de tiempo y clasificar el contenido por categorías, facilitando el aprendizaje autónomo y evitando perder el hilo de las clases.

Disponible acá : https://yt-course-tracker.vercel.app/

## Características principales

- **Captura automática de metadatos:** obtiene el título del video, el nombre del canal y la miniatura mediante la API oEmbed de YouTube.
- **Seguimiento automático del progreso:** guarda la posición de reproducción para que puedas retomar tus cursos desde el punto donde los dejaste.
- **Sincronización inteligente:** evita reemplazar un progreso más avanzado al registrar nuevamente un video existente.
- **Reproductor integrado:** permite visualizar los videos directamente desde la aplicación mediante `react-youtube`, con acceso a los controles de reproducción y navegación temporal.
- **Notas con marcas de tiempo:** registra apuntes asociados al segundo exacto del video y permite saltar directamente al momento correspondiente al seleccionar una nota.
- **Bookmarklet para guardar videos:** agrega un botón a la barra de marcadores del navegador para registrar videos de YouTube con un solo clic, incluyendo el tiempo actual de reproducción.
- **Categorización automática:** clasifica los videos mediante palabras clave presentes en sus títulos, con categorías como Python, SQL, JavaScript, DevOps e Inglés.
- **Gestión de cursos:** organiza el contenido en estados como «En curso» y «Completados», y permite eliminar videos mediante un modal de confirmación.
- **Interfaz moderna y responsiva:** ofrece una experiencia adaptada a computadoras, tabletas y dispositivos móviles.

## Tecnologías utilizadas

### Frontend

- **React:** construcción de la interfaz de usuario mediante componentes.
- **Vite:** entorno de desarrollo y herramienta de compilación.
- **Tailwind CSS:** estilos y diseño responsivo.
- **Lucide React:** iconografía de la interfaz.
- **react-youtube:** integración del reproductor de YouTube.
- **JavaScript:** lógica e interactividad del cliente.

### Backend

- **Python:** lenguaje principal del servidor.
- **FastAPI:** desarrollo de la API REST.
- **SQLAlchemy:** gestión de la persistencia mediante un ORM.
- **SQLite:** base de datos local para desarrollo.
- **Pydantic:** validación y estructuración de los datos.
- **Uvicorn:** servidor ASGI para ejecutar la aplicación.
- **HTTPX:** solicitudes HTTP para obtener metadatos de los videos.

> **Nota:** SQLite es adecuado para el desarrollo local. Para producción, se recomienda evaluar PostgreSQL y configurar una estrategia de almacenamiento persistente.

## Estructura del proyecto

```text
yt-course-tracker/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Configuración de FastAPI y rutas
│   │   ├── models.py          # Modelos de base de datos
│   │   ├── schemas.py         # Esquemas de validación Pydantic
│   │   ├── crud.py            # Operaciones de base de datos
│   │   └── youtube_utils.py   # Utilidades de YouTube y categorización
│   ├── requirements.txt       # Dependencias de Python
│   └── tracker.db             # Base de datos local (generada en ejecución)
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js         # Comunicación con el backend
│   │   ├── App.jsx             # Componente principal
│   │   ├── main.jsx            # Punto de entrada de React
│   │   └── index.css           # Estilos globales
│   ├── package.json            # Dependencias y scripts de Node.js
│   └── vite.config.js          # Configuración de Vite
│
└── README.md                   # Documentación del proyecto
```

> La estructura es orientativa y debe coincidir con los archivos reales del repositorio. El archivo `tracker.db` se genera localmente cuando la aplicación inicializa la base de datos, según la configuración del backend.

## Instalación y ejecución local

### 1. Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- Python 3.10 o una versión compatible con las dependencias del proyecto.
- Node.js y npm.
- Git.

Comprueba las versiones instaladas:

```bash
python --version
node --version
npm --version
git --version
```

### 2. Clonar el repositorio

Reemplaza `tu-usuario` por el nombre de usuario o la organización propietaria del repositorio.

```bash
git clone https://github.com/tu-usuario/yt-course-tracker.git
cd yt-course-tracker
```

### 3. Configurar y ejecutar el backend

Desde la carpeta raíz del proyecto, ejecuta:

```bash
cd backend
python -m venv venv
```

Activa el entorno virtual según tu sistema operativo.

**Windows — PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**Windows — CMD:**

```bat
venv\Scripts\activate.bat
```

**Linux o macOS:**

```bash
source venv/bin/activate
```

Instala las dependencias:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Inicia el servidor:

```bash
uvicorn app.main:app --reload --port 8000
```

El backend estará disponible en:

- **API:** http://localhost:8000
- **Documentación interactiva:** http://localhost:8000/docs
- **Documentación alternativa:** http://localhost:8000/redoc

La base de datos SQLite se utilizará según la configuración de conexión y de inicialización definida en el backend.

### 4. Configurar y ejecutar el frontend

Abre una segunda terminal y vuelve a la carpeta raíz del proyecto. Después, accede a `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará la dirección local del frontend, normalmente:

http://localhost:5173

Abre esa dirección en tu navegador para utilizar la aplicación.

> **Importante:** asegúrate de que el backend y el frontend estén ejecutándose simultáneamente y de que la URL de la API configurada en el frontend coincida con la dirección del backend.

## Configuración del bookmarklet

El bookmarklet permite guardar un video de YouTube en YT Course Tracker sin tener que copiar manualmente su enlace.

### 1. Crear el marcador

1. Abre tu navegador y entra en YouTube.
2. Muestra la barra de marcadores con `Ctrl + Shift + B` en navegadores compatibles.
3. Haz clic derecho sobre la barra y selecciona la opción para añadir un marcador.
4. Asigna el nombre **Guardar Curso**.
5. En el campo URL o dirección, pega el siguiente código JavaScript.

### 2. Código del bookmarklet

```javascript
javascript:(function(){if(!/^(www\.)?youtube\.com$/.test(location.hostname)&&location.hostname!=="m.youtube.com"){alert("Este botón solo funciona en YouTube.");return;}const video=document.querySelector("video");const time=video?Math.floor(video.currentTime):0;const url=new URL(location.href);if(time>0)url.searchParams.set("t",time+"s");const w=window.open("","yt_tracker_pop","width=400,height=200");if(!w){alert("Permite las ventanas emergentes para este sitio.");return;}w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>YT Course Tracker</title><style>body{background:#0f172a;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}p{font-size:14px;font-weight:bold;text-align:center;padding:16px}</style></head><body><p id="msg">Enviando a YT Course Tracker...</p></body></html>');const msg=w.document.getElementById("msg");fetch("http://localhost:8000/api/videos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:url.href})}).then(async r=>{if(!r.ok)throw new Error("Error HTTP "+r.status);msg.textContent="Curso guardado correctamente.";setTimeout(()=>w.close(),1200)}).catch(()=>{msg.textContent="No se pudo guardar el video. Comprueba que el backend esté activo."})})();
```

### 3. Cómo utilizarlo

1. Inicia el backend de YT Course Tracker.
2. Abre el video de YouTube que deseas guardar.
3. Reproduce el video hasta el punto que quieras registrar.
4. Haz clic en el marcador **Guardar Curso**.
5. Espera el mensaje de confirmación y comprueba que el video aparezca en tu aplicación.

**Consideraciones:**

- El bookmarklet está configurado para el entorno local y envía las solicitudes a `http://localhost:8000/api/videos`.
- El backend debe aceptar solicitudes `POST` en esa ruta y recibir un JSON con la propiedad `url`.
- Si el frontend y el backend utilizan orígenes distintos, configura correctamente CORS en FastAPI.
- Si el video se guarda desde otra página o desde un navegador diferente, verifica que la dirección del backend sea accesible desde ese entorno.
- El navegador puede bloquear ventanas emergentes o aplicar restricciones de seguridad. Además, algunas configuraciones de privacidad pueden impedir el funcionamiento del bookmarklet.
- Este código debe probarse con la implementación real del backend. No garantiza por sí solo que se conserve el progreso si la API no implementa la lógica correspondiente.

## Consideraciones de seguridad

- No expongas credenciales, tokens ni archivos de configuración con secretos en el repositorio.
- Configura CORS para permitir únicamente los orígenes necesarios en producción.
- No utilices `localhost` como dirección del backend cuando despliegues el frontend en un servidor público.
- Evita subir la base de datos local si contiene información personal o datos que no deban compartirse.
- Valida los enlaces de YouTube recibidos por la API antes de procesarlos.
- Configura una base de datos persistente y una estrategia de copias de seguridad para producción.

## Despliegue en producción

Para publicar YT Course Tracker y permitir su acceso desde otros dispositivos, puedes utilizar la siguiente arquitectura:

### Frontend

Despliega la aplicación React en una plataforma compatible con Vite, como Vercel o Netlify, conectando tu repositorio de GitHub.

Configura la URL pública del backend mediante una variable de entorno, por ejemplo:

```env
VITE_API_URL=https://tu-backend.example.com
```

El nombre de la variable debe coincidir con el que utilice el código del frontend. Vite expone al cliente las variables que comienzan con `VITE_`, por lo que no deben contener secretos.

### Backend

Despliega FastAPI en un servicio compatible con Python y ASGI, como Render o Railway, verificando las condiciones actuales de sus planes.

Para producción:

- Configura una base de datos PostgreSQL o una alternativa persistente.
- Define las variables de entorno necesarias.
- Configura CORS para el dominio del frontend.
- Utiliza HTTPS.
- Comprueba que el proveedor mantenga persistentes los datos y archivos necesarios.
- Configura correctamente el comando de inicio del servidor.

### Bookmarklet en producción

Actualiza la URL del endpoint dentro del bookmarklet para utilizar el dominio HTTPS del backend desplegado. De lo contrario, continuará enviando las solicitudes a tu computadora local.

## Posibles mejoras futuras

- Autenticación y gestión de usuarios.
- Sincronización del progreso entre dispositivos.
- Búsqueda avanzada por título, canal y categoría.
- Creación de listas de reproducción y rutas de aprendizaje.
- Estadísticas de estudio y seguimiento del tiempo invertido.
- Exportación de notas y progreso.
- Soporte para PostgreSQL en producción.
- Pruebas automatizadas para frontend y backend.
- Gestión de errores, registros y monitorización.

## 📄 Licencia

Si deseas distribuir o compartir este proyecto, añade un archivo `LICENSE` con la licencia elegida y actualiza esta sección para reflejarla.

---

**YT Course Tracker** — Organiza tus cursos, registra tu progreso y aprende a tu ritmo.
