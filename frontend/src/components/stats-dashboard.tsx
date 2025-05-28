import { useQuery } from '@tanstack/react-query'
import { Card, ProgressBar, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap'

interface StatsData {
  statuses: {
    [key: string]: number
  }
  points_leaders: {
    assignee: string
    points: number
  }[]
}

// Вспомогательная функция для иконок
const Icon = ({ icon, className = '' }: { icon: string, className?: string }) => (
  <span className={`d-inline-block me-2 ${className}`}>{icon}</span>
)

// Настройки отображения статусов
const statusDisplay = {
  'new': { label: 'Новые', variant: 'secondary', icon: '🔄' },
  'in_progress': { label: 'В процессе', variant: 'primary', icon: '⚙️' },
  'done': { label: 'Сделано', variant: 'success', icon: '✅' },
  'closed': { label: 'Закрыто', variant: 'dark', icon: '🎯' },
}

async function fetchStats(): Promise<StatsData> {
  const response = await fetch('http://localhost:8000/tasks/stats', {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Ошибка при загрузке статистики')
  }
  return response.json()
}

export function StatsDashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 60000, // Обновление каждую минуту
  })

  // Состояние загрузки
  if (isLoading) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="primary" className="me-2"/>
          <span className="text-muted align-middle">Загрузка статистики...</span>
        </Card.Body>
      </Card>
    )
  }

  // Состояние ошибки
  if (isError) {
    return (
      <Alert variant="danger" className="d-flex align-items-center">
         {/* Иконка ошибки Bootstrap */}
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill me-3 flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
          </svg>
        Ошибка при загрузке статистики
      </Alert>
    )
  }

  // Подсчет общего количества задач
  const totalTasks = Object.values(stats?.statuses || {}).reduce((sum, count) => sum + count, 0);
  const sortedStatuses = Object.entries(stats?.statuses || {}).sort(([a], [b]) => {
    const order = { new: 0, in_progress: 1, done: 2, closed: 3 };
    return (order[a as keyof typeof order] ?? 99) - (order[b as keyof typeof order] ?? 99);
  });

  return (
    <Card className="mb-4 shadow-sm hover-shadow transition-shadow">
      <Card.Header className="bg-light py-3">
        <Card.Title className="mb-0 h6 d-flex align-items-center">
          {/* Иконка статистики Bootstrap */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-bar-chart-line-fill me-2 text-primary" viewBox="0 0 16 16">
            <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1z"/>
          </svg>
          Статистика проекта
        </Card.Title>
      </Card.Header>
      
      <Card.Body>
        <div className="row g-4"> {/* Используем Bootstrap grid */}
          {/* Статистика по статусам */} 
          <div className="col-md-6">
            <h5 className="mb-3 fw-normal fs-6 text-muted">Статусы задач ({totalTasks})</h5>
            {totalTasks > 0 ? (
              <div className="vstack gap-3"> {/* Вертикальный стек для элементов */} 
                {sortedStatuses.map(([status, count]) => {
                  const displayInfo = statusDisplay[status as keyof typeof statusDisplay] || { label: status, variant: 'light', icon: '❓' };
                  const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  
                  return (
                    <div key={status}>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="d-flex align-items-center fw-medium">
                          <Icon icon={displayInfo.icon} />
                          {displayInfo.label}
                        </span>
                        <span className="text-muted">
                          {count} / {totalTasks}
                        </span>
                      </div>
                      <ProgressBar 
                        variant={displayInfo.variant} 
                        now={percentage} 
                        label={`${percentage}%`} 
                        className="progress-bar-striped progress-bar-animated" 
                        style={{ height: '10px' }} 
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted p-4 border rounded bg-light">
                 {/* Иконка задач Bootstrap */}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-journal-check mb-2 text-secondary" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                  <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
                  <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
                </svg>
                <p className="mb-0 small">Нет задач для отображения статистики.</p>
              </div>
            )}
          </div>
          
          {/* Лидеры по баллам */} 
          <div className="col-md-6">
            <h5 className="mb-3 fw-normal fs-6 text-muted">Лидеры по баллам</h5>
            {stats?.points_leaders && stats.points_leaders.length > 0 ? (
              <ListGroup variant="flush">
                {stats.points_leaders.map((leader, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center px-0">
                    <div className="d-flex align-items-center">
                       {/* Медаль или номер */} 
                      <Badge 
                        pill 
                        bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'danger-subtle' : 'light'}
                        text={index < 2 ? 'dark' : index === 2 ? 'danger-emphasis' : 'dark'}
                        className="me-3 fs-6"
                      >
                        {index + 1}
                      </Badge>
                      <span className="fw-medium text-dark text-truncate">{leader.assignee}</span>
                    </div>
                    <Badge bg="warning-subtle" text="warning-emphasis" pill className="d-flex align-items-center"> 
                       {/* Иконка звезды Bootstrap */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-star-fill me-1" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                      </svg>
                      {leader.points}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
               <div className="text-center text-muted p-4 border rounded bg-light">
                {/* Иконка трофея Bootstrap */}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-trophy mb-2 text-secondary" viewBox="0 0 16 16">
                  <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.166 1.961C12.668 3.048 12.332 2 12 2H4c-.332 0-.668 1.048-.966 1.997a3 3 0 1 1-1.166-1.961C1.988 1.55 2 1.038 2 .5zm0 1.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5zM4 12a4 4 0 0 1 8 0H4zm0 1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1zm4-8a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1"/>
                </svg>
                <p className="mb-0 small">Пока нет лидеров по баллам.</p>
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}