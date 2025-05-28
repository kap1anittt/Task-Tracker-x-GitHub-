import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, updateTaskStatus } from '../api/tasksApi'
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap'
import { Link } from '@tanstack/react-router'

interface TaskCardProps {
  task: Task
}

// Обновленный Маппинг статусов задач на русский с классами Bootstrap Badge
const statusMap = {
  'new': { label: 'Новая', bg: 'secondary', icon: '🔄' },
  'in_progress': { label: 'В процессе', bg: 'primary', icon: '⚙️' },
  'done': { label: 'Сделано', bg: 'success', icon: '✅' },
  'closed': { label: 'Закрыта', bg: 'dark', icon: '🎯' }, // Используем dark для закрытых
}

// Допустимые переходы статусов
const allowedStatusTransitions = {
  'new': ['in_progress'],
  'in_progress': ['done'],
  'done': ['closed'],
  'closed': [],
}

// Вспомогательная функция для иконок (можно заменить на Bootstrap Icons если нужно)
const Icon = ({ icon, className = '' }: { icon: string, className?: string }) => (
  <span className={`me-1 ${className}`}>{icon}</span>
)

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: string }) => 
      updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] }) // Инвалидируем статистику тоже
    },
    onError: (error) => {
      // TODO: Добавить более user-friendly обработку ошибок (например, Toast уведомление)
      console.error("Ошибка обновления статуса:", error);
    }
  })

  const handleStatusChange = (newStatus: string) => {
    mutation.mutate({ taskId: task.id, status: newStatus })
  }

  const currentStatusInfo = statusMap[task.status as keyof typeof statusMap] || 
    { label: task.status, bg: 'light', text: 'dark', icon: '❓' }
  
  const nextStatuses = allowedStatusTransitions[task.status as keyof typeof allowedStatusTransitions] || []

  return (
    <Link 
      to="/tasks/$taskId" 
      params={{ taskId: task.id.toString() }} 
      className="text-decoration-none text-reset h-100 d-block"
    >
      <Card className="h-100 shadow-sm hover-shadow transition-shadow">
        <Card.Body className="d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <Card.Title className="mb-0 me-2 h6">{task.title}</Card.Title>
            <Badge pill bg={currentStatusInfo.bg} className="text-nowrap flex-shrink-0">
              <Icon icon={currentStatusInfo.icon} />
              {currentStatusInfo.label}
            </Badge>
          </div>
          
          <div className="text-muted small mt-auto mb-3">
            <div className="mb-2 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-person me-2 flex-shrink-0" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              <span className="text-truncate">Ответственный: <span className="fw-medium text-dark">{task.assignee}</span></span>
            </div>
            
            {task.points > 0 && (
              <div className="d-flex align-items-center text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-star-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
                <span>Баллы: <span className="fw-bold text-dark">{task.points}</span></span>
              </div>
            )}
          </div>

          {(nextStatuses.length > 0 || mutation.isPending || mutation.isError) && (
            <div 
              className="mt-auto border-top pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              {nextStatuses.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {nextStatuses.map(status => {
                    const nextStatus = statusMap[status as keyof typeof statusMap];
                    return (
                      <Button
                        key={status}
                        variant="outline-primary" 
                        size="sm"
                        onClick={(e) => {
                           e.stopPropagation();
                           handleStatusChange(status);
                        }}
                        disabled={mutation.isPending}
                        className="d-flex align-items-center"
                      >
                        <Icon icon={nextStatus.icon} /> {nextStatus.label}
                      </Button>
                    );
                  })}
                </div>
              )}
              
              {mutation.isPending && (
                 <div className="d-flex align-items-center text-primary small">
                   <Spinner animation="border" size="sm" className="me-2" />
                   Обновление...
                 </div>
               )}
               
               {mutation.isError && (
                 <Alert variant="danger" className="d-flex align-items-center p-2 small mb-0">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                     <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                   </svg>
                   Ошибка обновления
                 </Alert>
               )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Link>
  )
} 