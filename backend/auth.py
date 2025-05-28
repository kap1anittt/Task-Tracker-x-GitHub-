from fastapi import APIRouter, HTTPException, Request, Response, Cookie, Depends
import httpx
from fastapi.responses import RedirectResponse
from typing import Optional
import json
import logging

logger = logging.getLogger("auth")

router = APIRouter(prefix="/auth")

GITHUB_CLIENT_ID = "Ov23liAo3QkmLLiAmTo8"
GITHUB_CLIENT_SECRET = "d0e474d699215b91b7cbf39acb47b540d26c5995"
GITHUB_CALLBACK_URL = "http://localhost:5173/github-callback"
FRONTEND_URL = "http://localhost:5173"

# Временное решение - хранение сессий в памяти (для разработки)
# В боевом окружении следует использовать Redis или другое хранилище
user_sessions = {}

@router.get("/github")
async def github_login():
    """Перенаправление на GitHub для авторизации"""
    github_oauth_url = (
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={GITHUB_CALLBACK_URL}&scope=read:user"
    )
    return RedirectResponse(github_oauth_url)

@router.get("/github/callback")
async def github_callback(code: str, response: Response):
    """Обработка callback от GitHub, получение токена и данных пользователя"""
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                },
            )
            token_data = token_response.json()
            token = token_data.get("access_token")

            if not token:
                # Log the full response if token is missing
                logger.error(f"Failed to get access token from GitHub. Response data: {token_data}")
                error_details = token_data.get("error_description") or token_data.get("error") or "Unknown error"
                raise HTTPException(status_code=500, detail=f"Не удалось получить access_token от GitHub: {error_details}")

            # Log the obtained token (first few chars for security)
            logger.info(f"Obtained GitHub access token (partial): {token[:6]}...")

            user_api_headers = {"Authorization": f"Bearer {token}"}
            logger.info(f"Requesting GitHub user data with headers: {user_api_headers}")
            user_response = await client.get(
                "https://api.github.com/user",
                headers=user_api_headers,
            )
            user_response.raise_for_status()
            user_info = user_response.json()

            # Debug: Логируем полученные данные пользователя
            logger.info(f"GitHub user data received: id={user_info.get('id')}, login={user_info.get('login')}")

            # Используем id как ключ сессии
            session_id = str(user_info.get("id", ""))
            if not session_id:
                 logger.error("GitHub user ID not found in user_info")
                 raise HTTPException(status_code=500, detail="Не удалось получить ID пользователя от GitHub")

            # Debug: Логируем перед сохранением сессии
            logger.info(f"Storing session for session_id: {session_id}")
            user_sessions[session_id] = user_info
            # Debug: Логируем размер словаря сессий
            logger.info(f"Current user_sessions size: {len(user_sessions)}")
            
            # Устанавливаем session_id в cookie
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                max_age=3600, # 1 час
                samesite="lax",
                # secure=True, # TODO: Включить для HTTPS в продакшене
                path="/",
            )
            
            # Убрал временное не-HttpOnly cookie `user_authenticated`
            
            # Debug: Логируем после установки cookie
            logger.info(f"Set cookie session_id={session_id} for user {user_info.get('login')}")
            
            # Debug: Логируем заголовки ответа
            logger.info(f"Response headers before sending: {response.headers}")
            
            # Перенаправляем на главную страницу фронтенда
            # return RedirectResponse(url=FRONTEND_URL) # Возвращаем редирект
            # Возвращаем успешный JSON-ответ, навигацию сделает фронтенд
            return {"message": "Authentication successful, cookie set"}

    except httpx.HTTPStatusError as exc:
        logger.error(f"HTTP error occurred during GitHub callback: {exc.response.status_code} - {exc.response.text}")
        raise HTTPException(status_code=500, detail=f"Ошибка при взаимодействии с GitHub: {exc.response.status_code}")
    except Exception as e:
        logger.error(f"Unexpected error in github_callback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при авторизации")

# Фикция проверки текущего пользователя
async def get_current_user_from_cookie(session_id: Optional[str] = Cookie(None)):
    # Debug: Логируем полученный session_id из cookie
    logger.info(f"Checking cookie: session_id={session_id}")
    if not session_id:
        logger.warning("No session_id cookie found")
        raise HTTPException(status_code=401, detail="Пользователь не авторизован (нет cookie)")
    
    # Debug: Проверяем наличие session_id в словаре
    if session_id not in user_sessions:
        logger.warning(f"session_id '{session_id}' not found in user_sessions. Current keys: {list(user_sessions.keys())}")
        raise HTTPException(status_code=401, detail="Пользователь не авторизован (сессия не найдена)")
        
    logger.info(f"Session found for session_id: {session_id}")
    return user_sessions[session_id]

@router.get("/me")
async def get_current_user(request: Request, user = Depends(get_current_user_from_cookie)):
    """Получение информации о текущем пользователе"""
    logger.info(f"GET /me request with cookies: {request.cookies}")
    try:
        # Для отладки возвращаем тестового пользователя
        if not user:
            # Создаем тестового пользователя для разработки
            return {
                "id": 12345,
                "login": "test_user",
                "name": "Test User",
                "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4"
            }
        return user
    except Exception as e:
        logger.error(f"Error in get_current_user: {e}")
        raise HTTPException(status_code=401, detail=f"Ошибка: {str(e)}")

@router.post("/logout")
async def logout(response: Response, session_id: Optional[str] = Cookie(None)):
    """Выход пользователя"""
    if session_id and session_id in user_sessions:
        del user_sessions[session_id]
    
    response.delete_cookie(key="session_id")
    return {"message": "Выход выполнен успешно"} 
