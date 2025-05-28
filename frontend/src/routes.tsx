import { RootRoute, Route, Router as TanStackRouter, RouterProvider, createRoute, createRootRoute } from '@tanstack/react-router'
// Импортируем ВСЕ компоненты страниц
import { TasksPage } from './pages/tasks-page'
import { CreateTaskPage } from './pages/create-task-page'
import { TaskDetailPage } from './pages/task-detail-page'
import { EditTaskPage } from './pages/edit-task-page'
import { LoginPage } from './pages/login-page'
import { GitHubCallbackPage } from './pages/github-callback-page' // Добавляем импорт
import { Layout } from './components/layout'


// Корневой маршрут (используем createRootRoute)
const rootRoute = createRootRoute({
  component: Layout,
})

// --- Определяем все маршруты здесь ---

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TasksPage, // Главная страница теперь TasksPage
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'tasks',
  // Можно добавить компонент-обертку для /tasks/*, если нужно
})

const tasksIndexRoute = createRoute({
    getParentRoute: () => tasksRoute,
    path: '/', // Соответствует /tasks/
    component: TasksPage,
})

const taskDetailRoute = createRoute({
  getParentRoute: () => tasksRoute,
  path: '$taskId',
  component: TaskDetailPage,
})

const taskEditRoute = createRoute({
  getParentRoute: () => tasksRoute,
  path: '$taskId/edit',
  component: EditTaskPage,
})

const createRouteConfig = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreateTaskPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// Маршрут для коллбэка GitHub
const githubCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/github-callback',
  component: GitHubCallbackPage, // Используем УПРОЩЕННЫЙ компонент
})

// Собираем дерево маршрутов СО ВСЕМИ маршрутами
const routeTree = rootRoute.addChildren([
  indexRoute, // Главная '/' -> TasksPage
  tasksRoute.addChildren([tasksIndexRoute, taskDetailRoute, taskEditRoute]), // Вложенные /tasks/*
  createRouteConfig, // /create
  loginRoute, // /login
  githubCallbackRoute, // /github-callback
])

// Создание экземпляра маршрутизатора
const router = new TanStackRouter({ routeTree })

// Экспорт компонента Router Provider
export function Router() {
  return <RouterProvider router={router} />
}

// Регистрация маршрутизатора
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 