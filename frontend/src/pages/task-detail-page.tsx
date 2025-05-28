import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { fetchTaskById, assignBranchResponsible, API_URL } from '../api/tasksApi';
import ReactMarkdown from 'react-markdown';
import { Container, Spinner, Alert, Card, Badge, Row, Col, Image, ListGroup, Button, Form, InputGroup } from 'react-bootstrap';
import { useState, useEffect } from 'react';

// Статус маппинг можно вынести в утилиты
const statusMap: Record<string, { label: string; bg: string; icon: string }> = {
  'new': { label: 'Новая', bg: 'secondary', icon: '🆕' },
  'open': { label: 'Открыта', bg: 'secondary', icon: '🆕' },
  'in_progress': { label: 'В процессе', bg: 'primary', icon: '⚙️' },
  'Ожидает ревью': { label: 'Ожидает ревью', bg: 'info', icon: '👀' },
  'Ревью пройдено': { label: 'Ревью пройдено', bg: 'success', icon: '👍' },
  'Требуются доработки': { label: 'Требуются доработки', bg: 'warning', icon: '✏️' },
  'done': { label: 'Сделано', bg: 'success', icon: '✅' },
  'closed': { label: 'Закрыта', bg: 'dark', icon: '🎯' },
};

export function TaskDetailPage() {
  const params = useParams({ from: '/tasks/$taskId' }); 
  const taskId = params.taskId;
  const taskIdNumber = parseInt(taskId, 10);
  const queryClient = useQueryClient();

  // Состояние для поля ввода логина
  const [branchAssigneeLogin, setBranchAssigneeLogin] = useState('');

  const { data: task, isLoading, isError, error, isSuccess } = useQuery({
    queryKey: ['task', taskIdNumber],
    queryFn: () => fetchTaskById(taskIdNumber),
    enabled: !isNaN(taskIdNumber),
  });

  // Используем useEffect для установки начального значения ПОСЛЕ успешной загрузки
  useEffect(() => {
    if (isSuccess && task?.branch_assignee_github_login) {
      setBranchAssigneeLogin(task.branch_assignee_github_login);
    }
    // Если при обновлении ответственный удалился (стал null), очищаем поле
    else if (isSuccess && !task?.branch_assignee_github_login) {
      setBranchAssigneeLogin('');
    }
  }, [isSuccess, task?.branch_assignee_github_login]);

  // Мутация для назначения ответственного
  const assignMutation = useMutation({ 
    mutationFn: (login: string) => assignBranchResponsible(taskIdNumber, login),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskIdNumber] });
      // Можно использовать react-toastify или аналоги для уведомлений
      console.log('Ответственный за ветку назначен!');
    },
    onError: (err) => {
      console.error('Ошибка назначения:', err);
      alert(`Ошибка назначения: ${(err as Error).message}`);
    }
  });

  const handleAssignSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (branchAssigneeLogin.trim()) {
        assignMutation.mutate(branchAssigneeLogin.trim());
    }
  };

  // ... Обработка isNaN(taskIdNumber), isLoading, isError, !task ...
  if (isNaN(taskIdNumber)) {
    return <Container className="py-4"><Alert variant="danger">Некорректный ID задачи.</Alert></Container>;
  }
  if (isLoading) {
    return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Загрузка задачи...</p></Container>;
  }
  if (isError) {
    return <Container className="py-4"><Alert variant="danger"><Alert.Heading>Ошибка</Alert.Heading><p>{(error as Error)?.message || 'Не удалось загрузить задачу.'}</p></Alert></Container>;
  }
  if (!task) {
     return <Container className="py-4"><Alert variant="warning">Задача не найдена.</Alert></Container>;
  }

  const currentStatusInfo = statusMap[task.status] || { label: task.status, bg: 'light', icon: '❓' };

  return (
    <Container className="py-4">
      <Row>
        {/* Левая колонка */}
        <Col md={8} lg={9} className="mb-4 mb-md-0">
          {/* Ключ задачи (перемещен сюда) */}
          <small className="text-muted d-block mb-1">TASK-{task.id}</small>
          
          {/* Заголовок задачи */} 
          <h1 className="h3 mb-3 text-break">{task.title}</h1>
          
          {/* Статус и Исполнитель (перемещены сюда) */}
          <div className="d-flex align-items-center flex-wrap mb-3 text-muted">
             <div className="me-3 d-flex align-items-center">
               <small className="me-1">Статус:</small>
               <Badge pill bg={currentStatusInfo.bg} className="ms-1">
                 <span className="me-1">{currentStatusInfo.icon}</span>
                 {currentStatusInfo.label}
               </Badge>
             </div>
             {/* Отображаем либо branch_assignee, либо assignee */} 
             {(task.branch_assignee_github_login || task.assignee) && (
              <div className="d-flex align-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-fill me-1" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                  </svg>
                <small className="me-1">
                    Исполнитель:
                </small>
                <span className="fw-medium text-dark">{task.branch_assignee_github_login || task.assignee}</span>
              </div>
             )}
          </div>

          {/* Описание */} 
          <Card className="shadow-sm mb-4">
            <Card.Body>
               <div className="markdown-content">
                 <ReactMarkdown>
                   {task.description || '*Описание задачи отсутствует*'} 
                 </ReactMarkdown>
               </div>
            </Card.Body>
          </Card>

          {/* Изображения */} 
          {task.image_urls && task.image_urls.length > 0 && (
            <Card className="shadow-sm">
               <Card.Header><h3 className="h6 mb-0">Прикрепленные изображения</h3></Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  {task.image_urls.map(url => {
                    // Формируем полный URL, если url - относительный путь
                    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
                    return (
                      <a key={url} href={fullUrl} target="_blank" rel="noopener noreferrer">
                        <Image src={fullUrl} thumbnail width={100} height={100} style={{ objectFit: 'cover' }} alt="Изображение"/>
                      </a>
                    )
                  })}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Правая колонка */} 
        <Col md={4} lg={3}>
           <div className="position-sticky" style={{ top: '1rem' }}> 
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                 <h2 className="h6 mb-0">Детали</h2>
                 <Link to="/tasks/$taskId/edit" params={{ taskId }}>
                    <Button variant="outline-secondary" size="sm" className="py-0 px-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.172 1.708L11.146 4.536 14.464 7.854l2.043-2.043a.5.5 0 0 0-.707-.707zM10.5 1.793L4.207 8.086a.5.5 0 0 0-.146.275l-.819 2.867a.5.5 0 0 0 .62.62l2.867-.819a.5.5 0 0 0 .275-.146L14.207 5.5z"/>
                        </svg>
                    </Button>
                 </Link>
               </Card.Header>
               <ListGroup variant="flush">
                 {/* Информация о ветке */}
                 {task.branch_name && (
                   <ListGroup.Item className="py-2 px-3">
                     <small className="text-muted d-block mb-1">Ветка:</small>
                     <Badge bg="info" text="dark" className="fw-normal">{task.branch_name}</Badge>
                   </ListGroup.Item>
                 )}
                 {/* Наблюдатели (исправлено observers -> watchers) */} 
                 {task.watchers && task.watchers.length > 0 && (
                   <ListGroup.Item className="py-2 px-3">
                     <small className="text-muted d-block mb-1">Наблюдатели:</small>
                     <div>
                       {task.watchers.map(w => <Badge key={w} bg="light" text="dark" className="me-1 fw-normal">{w}</Badge>)} 
                     </div>
                   </ListGroup.Item>
                 )}
                 {/* Ревьюеры */} 
                 {task.reviewers && task.reviewers.length > 0 && (
                   <ListGroup.Item className="py-2 px-3">
                     <small className="text-muted d-block mb-1">Ревьюеры:</small>
                     <div>
                       {task.reviewers.map(r => <Badge key={r} bg="light" text="dark" className="me-1 fw-normal">{r}</Badge>)} 
                     </div>
                   </ListGroup.Item>
                 )}
                  {/* Баллы */} 
                 {task.points > 0 && (
                   <ListGroup.Item className="py-2 px-3">
                     <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Баллы:</small>
                        <span className="fw-bold text-warning d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-star-fill me-1" viewBox="0 0 16 16">
                             <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                          </svg>
                          {task.points}
                        </span>
                     </div>
                   </ListGroup.Item>
                 )}
               </ListGroup>
            </Card>
            
             {/* Новая карточка для назначения ответственного за ветку */} 
            {task.branch_name && ( /* Показываем только если есть ветка */ 
                <Card className="shadow-sm">
                    <Card.Header>
                        <h3 className="h6 mb-0">Ответственный за ветку</h3>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleAssignSubmit}>
                            <InputGroup size="sm">
                                <Form.Control
                                    placeholder="GitHub Login"
                                    aria-label="GitHub Login ответственного"
                                    value={branchAssigneeLogin}
                                    onChange={(e) => setBranchAssigneeLogin(e.target.value)}
                                    disabled={assignMutation.isPending} // Блокируем во время запроса
                                />
                                <Button 
                                    variant="outline-primary" 
                                    type="submit" 
                                    disabled={!branchAssigneeLogin.trim() || assignMutation.isPending}
                                >
                                     {assignMutation.isPending ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> : 'Назначить'}
                                </Button>
                            </InputGroup>
                            {assignMutation.isError && (
                                <Alert variant="danger" className="mt-2 p-1 text-center" style={{ fontSize: '0.8em' }}>
                                   {(assignMutation.error as Error)?.message || 'Ошибка'}
                                </Alert>
                            )}
                        </Form>
                    </Card.Body>
                </Card>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
