from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from databases import Database
import logging

logger = logging.getLogger("database")

DATABASE_URL = "sqlite:///./test.db"  # заменить на PostgreSQL потом

database = Database(DATABASE_URL)
metadata = MetaData()
Base = declarative_base()

# Создание подключения к БД для SQLAlchemy
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

async def init_db():
    """Инициализация базы данных"""
    try:
        # Подключение к базе данных
        await database.connect()
        logger.info("Подключение к базе данных установлено")
        
        # Создание таблиц в базе данных
        from models import tasks # Импорт здесь, чтобы избежать циклической зависимости
        metadata.create_all(engine)
        logger.info("Таблицы созданы в базе данных")
        
    except Exception as e:
        logger.error(f"Ошибка при инициализации БД: {e}", exc_info=True)
        raise
