from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from github_webhook import router as github_router
from database import init_db
from routes.tasks import router as tasks_router
from auth import router as auth_router
from contextlib import asynccontextmanager
import logging
import shutil
import os

UPLOAD_DIR = "backend/uploads"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Код выполняется при запуске
    # Создаем директорию для загрузок, если она не существует
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Настраиваем раздачу статики ПОСЛЕ создания директории
    # Явно указываем путь от корня
    app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")
    
    await init_db()
    yield
    # Код выполняется при завершении
    # Здесь можно добавить закрытие соединений с БД при необходимости


app = FastAPI(lifespan=lifespan)

# Настройка логирования для отладки
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# Настройка CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Добавляем middleware для логирования запросов
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# Подключение маршрутов
app.include_router(github_router)
app.include_router(tasks_router)
app.include_router(auth_router)

# Эндпоинт для загрузки файлов
@app.post("/uploads/")
async def upload_file(file: UploadFile = File(...)):
    # Сохраняем в директорию UPLOAD_DIR (т.е. backend/uploads/)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    # Генерируем уникальное имя файла, если файл с таким именем уже существует
    base, extension = os.path.splitext(file.filename)
    counter = 1
    while os.path.exists(file_path):
        # Используем UPLOAD_DIR для генерации пути
        file_path = os.path.join(UPLOAD_DIR, f"{base}_{counter}{extension}")
        counter += 1
        
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
        
    # Возвращаем относительный URL
    # Имя файла берем из конечного file_path, чтобы учесть возможные _{counter}
    return {"url": f"/uploads/{os.path.basename(file_path)}"}