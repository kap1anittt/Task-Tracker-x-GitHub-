const API_BASE_URL = 'http://localhost:8000'

export interface User {
  id: number
  login: string
  avatar_url: string
  name: string
}

// URL для редиректа на GitHub для авторизации
export function getGitHubAuthUrl(): string {
  return `${API_BASE_URL}/auth/github`
}

// Получение информации о текущем авторизованном пользователе
export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Пользователь не авторизован')
  }
  return response.json()
}

// Отправка кода авторизации на бэкенд для обмена на токен
export async function handleGitHubCallback(code: string): Promise<void> {
  console.log('[handleGitHubCallback] Starting with code:', code); // Лог начала
  const callbackUrl = `${API_BASE_URL}/auth/github/callback?code=${code}`;
  console.log('[handleGitHubCallback] Calling backend URL:', callbackUrl); // Лог URL
  try {
    const response = await fetch(callbackUrl, {
      method: 'GET',
      credentials: 'include',
      // redirect: 'follow' // 'follow' по умолчанию, можно не указывать
    });
    console.log('[handleGitHubCallback] Backend response status:', response.status); // Лог статуса
    console.log('[handleGitHubCallback] Backend response ok:', response.ok); // Лог ok
    console.log('[handleGitHubCallback] Backend response headers:', [...response.headers.entries()]); // Лог заголовков

    if (!response.ok) {
      let errorData = { detail: `Ошибка при обработке GitHub callback: ${response.status}` };
      try {
          errorData = await response.json();
      } catch (e) {
          console.warn('[handleGitHubCallback] Failed to parse error JSON');
      }
      console.error('[handleGitHubCallback] Error response data:', errorData);
      throw new Error(errorData.detail || `Не удалось завершить авторизацию GitHub (${response.status})`);
    }
    
    // Если ответ ok, ожидаем, что cookie установлен
    console.log('[handleGitHubCallback] Callback successful, expecting cookie to be set.');
    
  } catch (error) {
     console.error('[handleGitHubCallback] Fetch failed:', error); // Лог ошибки fetch
     throw error; // Перебрасываем ошибку дальше
  }
}

// Выход пользователя
export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  // Очистка локального состояния после выхода
  localStorage.removeItem('isAuthenticated')
} 