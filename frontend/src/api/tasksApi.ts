import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Task {
  id: number
  title: string
  status: string // 'new' | 'in_progress' | 'done' | 'closed'
  assignee: string | null
  points: number
  description: string | null
  observers: string[]
  reviewers: string[]
  image_urls: string[]
  branch_name?: string | null
  branch_assignee_github_login?: string | null
  github_issue_url: string | null
  watchers: string[]
}

// Тип данных для обновления задачи (все поля опциональны)
export type TaskUpdatePayload = Partial<Omit<Task, 'id' | 'points'> & { status?: string }>;

// Получение списка всех задач
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/tasks/`)
  return response.data
}

// Новая функция для получения задачи по ID
export const fetchTaskById = async (taskId: number): Promise<Task> => {
  const response = await axios.get(`${API_URL}/tasks/${taskId}`)
  return response.data
}

// Создание новой задачи (используем TaskUpdatePayload, но title и assignee обязательны)
export const createTask = async (taskData: Required<Pick<TaskUpdatePayload, 'title' | 'assignee'>> & TaskUpdatePayload): Promise<Task> => {
  const response = await axios.post(`${API_URL}/tasks/`, taskData)
  return response.data
}

// Новая функция для обновления задачи
export const updateTask = async (taskId: number, taskData: TaskUpdatePayload): Promise<Task> => {
  const response = await axios.patch(`${API_URL}/tasks/${taskId}`, taskData);
  return response.data;
};

// Функция для получения статистики
export interface StatsData {
  statuses: Record<string, number>;
  points_leaders: { assignee: string; points: number }[];
}

export const fetchStats = async (): Promise<StatsData> => {
    const response = await axios.get(`${API_URL}/tasks/stats`);
    return response.data;
};

// Функция для загрузки файла
export const uploadFile = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/uploads/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Новая функция для назначения ответственного за ветку
export const assignBranchResponsible = async (taskId: number, githubLogin: string): Promise<Task> => {
  const response = await axios.patch(`${API_URL}/tasks/${taskId}/assign_branch`, {
    branch_assignee_github_login: githubLogin,
  });
  return response.data;
};

// TODO: Добавить функцию для обновления задачи (PATCH /tasks/{taskId}) с новыми полями 