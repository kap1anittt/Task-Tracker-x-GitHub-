import { useQuery } from '@tanstack/react-query'
import { fetchTasks, Task } from '../api/tasksApi'
import { StatsDashboard } from '../components/stats-dashboard'
import { Link } from '@tanstack/react-router'
import { Container, Spinner, Alert, Button, Badge, Table } from 'react-bootstrap'

// Маппинг статусов можно оставить для бейджей в таблице
const statusMap: Record<string, { label: string; bg: string; icon: string }> = {
  'new': { label: 'Новая', bg: 'secondary', icon: '🔄' },
  'in_progress': { label: 'В процессе', bg: 'primary', icon: '⚙️' },
  'done': { label: 'Сделано', bg: 'success', icon: '✅' },
  'closed': { label: 'Закрыта', bg: 'dark', icon: '🎯' },
};

// Вспомогательный компонент для отображения статуса
function TaskStatusBadge({ status }: { status: string }) {
   const currentStatusInfo = statusMap[status] || 
      { label: status, bg: 'light', icon: '❓' };
   return (
     <Badge pill bg={currentStatusInfo.bg} className="text-nowrap">
        <span className="me-1">{currentStatusInfo.icon}</span>
        {currentStatusInfo.label}
     </Badge>
   );
}

export function TasksPage() {
  const { data: tasks, isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  // Состояние загрузки
  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" className="me-2"/>
        <span className="text-muted align-middle">Загрузка задач...</span>
      </Container>
    )
  }

  // Состояние ошибки
  if (isError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading className="d-flex align-items-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill me-3 flex-shrink-0" viewBox="0 0 16 16">
               <path fillRule="evenodd" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
             </svg>
            Ошибка при загрузке задач
          </Alert.Heading>
          <p>{(error as Error).message || 'Произошла неизвестная ошибка при загрузке задач'}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => window.location.reload()} variant="outline-danger">
              Попробовать снова
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  // Состояние, когда задач нет
  if (!tasks || tasks.length === 0) {
    return (
      <Container className="py-4">
        <StatsDashboard />
        <div className="text-center p-5 mt-4 bg-light border rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-journal-check mb-3 text-secondary" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
            <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
          </svg>
          <h3 className="h5">Нет активных задач</h3>
          <p className="text-muted mb-4">Создайте новую задачу, чтобы начать отслеживание.</p>
          <Button as={Link} to="/create" variant="primary">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg me-1 align-baseline" viewBox="0 0 16 16">
               <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
             </svg>
            Создать задачу
          </Button>
        </div>
      </Container>
    )
  }
  
  // Отображение статистики и ТАБЛИЦЫ задач
  return (
    <Container fluid className="py-4"> {/* Используем fluid для большей ширины */} 
      <StatsDashboard />
      
      <div className="d-flex justify-content-between align-items-center my-4">
        <h1 className="h4 mb-0">Задачи</h1>
        {/* TODO: Добавить фильтры и поиск как в Yandex Tracker */}
        <Button as={Link} to="/create" variant="primary" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg me-1 align-baseline" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
          </svg>
          Создать задачу
        </Button>
      </div>
      
      {/* Таблица задач */} 
      <Table striped bordered hover responsive size="sm" className="align-middle mt-3"> {/* Добавляем size="sm" и отступ */} 
         <thead className="table-light">
           <tr>
             {/* <th><Form.Check type="checkbox" /></th>  Пока без чекбоксов */} 
             <th>Ключ</th>
             <th>Задача</th>
             <th>Исполнитель</th>
             <th>Статус</th>
             <th>Обновлено</th>
           </tr>
         </thead>
         <tbody>
           {tasks.map(task => (
             <tr key={task.id}>
               <td>
                 <Link 
                   to="/tasks/$taskId"
                   params={{ taskId: task.id.toString() }}
                   className="fw-medium text-decoration-none"
                 >
                   TASK-{task.id} {/* Простой ключ */}
                 </Link>
               </td>
               <td>
                  <Link 
                    to="/tasks/$taskId"
                    params={{ taskId: task.id.toString() }}
                    className="text-dark text-decoration-none"
                  >
                    {task.title}
                  </Link>
               </td>
               <td>{task.assignee}</td>
               <td><TaskStatusBadge status={task.status} /></td>
               <td>{/* *дата* - Убираем заглушку */}</td> 
             </tr>
           ))}
         </tbody>
       </Table>
    </Container>
  )
} 