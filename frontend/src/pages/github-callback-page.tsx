import { useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleGitHubCallback } from '../api/authApi';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';

// Определяем тип для параметров поиска
interface GitHubCallbackSearch {
  code?: string;
  error?: string;
  error_description?: string;
}

export function GitHubCallbackPage() {
  console.log("GitHubCallbackPage mounted (restored)"); // Лог 1: Компонент смонтирован (восстановлен)
  // Получаем параметры из URL (?code=... или ?error=...)
  const search: GitHubCallbackSearch = useSearch({ from: '/github-callback' });
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Раскомментируем
  const hasCalledMutation = useRef(false); // Реф для отслеживания вызова

  const mutation = useMutation({
    mutationFn: handleGitHubCallback,
    onSuccess: () => {
      console.log("GitHubCallbackPage onSuccess: Invalidating currentUser query and navigating to /tasks");
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }); 
      navigate({ to: '/tasks' });
    },
    onError: (error) => {
      console.error("GitHubCallbackPage onError (mutation):", error);
    },
  });

  useEffect(() => {
    console.log("GitHubCallbackPage useEffect triggered. Search params:", search); // Лог 2: Эффект запущен, параметры поиска

    // Вызываем мутацию только один раз, если есть код и вызов еще не был сделан
    if (search.code && !hasCalledMutation.current) {
      console.log("GitHubCallbackPage useEffect: Found code, calling mutation.mutate with:", search.code); // Лог 3: Вызываем мутацию с кодом
      hasCalledMutation.current = true; // Отмечаем, что вызов сделан
      mutation.mutate(search.code);
    } else if (search.error) {
      console.error("GitHubCallbackPage useEffect: GitHub returned an error:", search.error, search.error_description); // Лог 4: GitHub вернул ошибку
      // Если пришел ответ с ошибкой от GitHub, не нужно ничего больше делать,
      // состояние ошибки уже будет отображено в JSX по search.error
    } else if (!search.code && !search.error && !mutation.isPending && !mutation.isSuccess) {
      // Это условие срабатывает, если в URL нет ни кода, ни ошибки,
      // и мутация не запущена или не завершилась успехом. Возможно, странный случай?
      console.warn('GitHubCallbackPage useEffect: No code or error found in GitHub callback URL, and mutation is not pending/successful');
      // mutation.reset(); // Возможно, reset здесь не нужен?
    }

    // Убираем mutation из зависимостей, чтобы эффект не перезапускался при изменении состояния мутации.
    // Запускаем только при изменении параметров поиска.
  }, [search.code, search.error, mutation]); // Добавляем mutation обратно в зависимости, ref не вызывает ререндер

  // Отображение состояния (восстановленное)
  return (
    <Container className="text-center py-5">
      {mutation.isPending && (
        <>
          <Spinner animation="border" variant="primary" className="me-2" />
          <span className="text-muted align-middle">Завершение авторизации через GitHub...</span>
        </>
      )}
      {(mutation.isError || search.error) && (
        <Alert variant="danger">
          <Alert.Heading>Ошибка авторизации</Alert.Heading>
          <p>{(mutation.error as Error)?.message || search.error_description || 'Не удалось авторизоваться через GitHub.'}</p>
          <Button onClick={() => navigate({ to: '/' })} variant="outline-danger">
            Вернуться на главную
          </Button>
        </Alert>
      )}
      {!mutation.isPending && !mutation.isError && !search.error && !search.code &&
         <Alert variant="warning">Не удалось определить статус авторизации.</Alert>
       }
    </Container>
  );
} 