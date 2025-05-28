import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { fetchTaskById, updateTask, uploadFile, TaskUpdatePayload } from '../api/tasksApi'
import { Form, Button, Card, FloatingLabel, Spinner, Alert, Image, CloseButton, Container } from 'react-bootstrap'

export function EditTaskPage() {
  const { taskId } = useParams({ from: '/tasks/$taskId/edit' });
  const taskIdNumber = parseInt(taskId, 10);
  
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Состояния формы
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [observersInput, setObserversInput] = useState('')
  const [reviewersInput, setReviewersInput] = useState('')
  const [status, setStatus] = useState('') // Статус тоже можно редактировать?
  
  // Состояния UI
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Загрузка данных задачи для редактирования
  const { data: taskData, isLoading: isLoadingTask, isError: isTaskError, error: taskError } = useQuery({
    queryKey: ['task', taskIdNumber],
    queryFn: () => fetchTaskById(taskIdNumber),
    enabled: !isNaN(taskIdNumber),
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
  });

  // Заполнение формы после загрузки данных
  useEffect(() => {
    if (taskData) {
      setTitle(taskData.title || '');
      setAssignee(taskData.assignee || '');
      setDescription(taskData.description || '');
      setImageUrls(taskData.image_urls || []);
      setObserversInput((taskData.observers || []).join(', '));
      setReviewersInput((taskData.reviewers || []).join(', '));
      setStatus(taskData.status || '');
    }
  }, [taskData]);

  // Мутация для обновления задачи
  const mutation = useMutation({
    mutationFn: (payload: { taskId: number; data: TaskUpdatePayload }) => 
      updateTask(payload.taskId, payload.data),
    onSuccess: (updatedTask) => {
      // Обновляем кэш для списка задач и для конкретной задачи
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      navigate({ to: '/tasks/$taskId', params: { taskId: updatedTask.id.toString() } });
      // TODO: Toast об успехе
    },
    onError: (error) => {
      setApiError((error as Error).message || 'Произошла неизвестная ошибка при обновлении');
      // TODO: Toast об ошибке
    }
  });

  // Обработчики загрузки и удаления изображений (такие же, как в CreateTaskPage)
   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      setImageUrls(prev => [...prev, result.url]);
    } catch (err) { 
      setUploadError((err as Error).message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
      event.target.value = ''; 
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  // Обработчик отправки формы
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    
    setApiError(null);
    setValidated(true);
    
    if (form.checkValidity() === true && !isNaN(taskIdNumber)) {
      const observers = observersInput.split(',').map(s => s.trim()).filter(Boolean);
      const reviewers = reviewersInput.split(',').map(s => s.trim()).filter(Boolean);
      
      const payload: TaskUpdatePayload = {
        title,
        assignee,
        description,
        image_urls: imageUrls,
        observers,
        reviewers,
        status, // Включаем статус в обновление
      };
      
      mutation.mutate({ taskId: taskIdNumber, data: payload });
    }
  };

  // --- Отображение состояний загрузки/ошибки --- 
  if (isNaN(taskIdNumber)) {
      return <Container className="py-4"><Alert variant="danger">Некорректный ID задачи.</Alert></Container>;
  }
  if (isLoadingTask) {
      return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Загрузка задачи...</p></Container>;
  }
  if (isTaskError) {
      return <Container className="py-4"><Alert variant="danger"><Alert.Heading>Ошибка</Alert.Heading><p>{(taskError as Error)?.message || 'Не удалось загрузить задачу.'}</p></Alert></Container>;
  }
  if (!taskData) {
      return <Container className="py-4"><Alert variant="warning">Задача не найдена.</Alert></Container>;
  }

  // --- Основная форма --- 
  return (
    <div className="mx-auto" style={{ maxWidth: '600px' }}>
      <div className="mb-4">
         <h2 className="h4 mb-1 d-flex align-items-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-pencil-square me-2 text-primary" viewBox="0 0 16 16">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
              <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
            </svg>
          Редактирование задачи #{taskId}
        </h2>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            {/* Title */}
            <FloatingLabel controlId="taskTitle" label="Название задачи" className="mb-3">
              <Form.Control required type="text" placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} isInvalid={validated && !title.trim()} />
              <Form.Control.Feedback type="invalid">Введите название.</Form.Control.Feedback>
            </FloatingLabel>

             {/* Description */} 
            <FloatingLabel controlId="taskDescription" label="Описание (Markdown)" className="mb-3">
              <Form.Control as="textarea" placeholder="Описание" style={{ height: '150px' }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </FloatingLabel>

            {/* Assignee */}
            <FloatingLabel controlId="taskAssignee" label="Ответственный (логин GitHub)" className="mb-3">
              <Form.Control required type="text" placeholder="Логин" value={assignee} onChange={(e) => setAssignee(e.target.value)} isInvalid={validated && !assignee.trim()} />
              <Form.Control.Feedback type="invalid">Укажите ответственного.</Form.Control.Feedback>
            </FloatingLabel>
            
             {/* Status - Возможно, стоит сделать выпадающим списком? */}
             <FloatingLabel controlId="taskStatus" label="Статус" className="mb-3">
                 <Form.Control type="text" placeholder="Статус" value={status} onChange={(e) => setStatus(e.target.value)} />
             </FloatingLabel>

            {/* Observers */} 
            <FloatingLabel controlId="taskObservers" label="Наблюдатели (через запятую)" className="mb-3">
              <Form.Control type="text" placeholder="Логины" value={observersInput} onChange={(e) => setObserversInput(e.target.value)} />
            </FloatingLabel>

            {/* Reviewers */} 
            <FloatingLabel controlId="taskReviewers" label="Ревьюеры PR (через запятую)" className="mb-3">
              <Form.Control type="text" placeholder="Логины" value={reviewersInput} onChange={(e) => setReviewersInput(e.target.value)} />
            </FloatingLabel>

             {/* Image Upload */} 
             <Form.Group controlId="taskImages" className="mb-3">
              <Form.Label>Изображения</Form.Label>
              {/* Отображение текущих/загруженных изображений */} 
              {imageUrls.length > 0 && (
                 <div className="mb-2 d-flex flex-wrap gap-2">
                   {imageUrls.map(url => (
                     <div key={url} className="position-relative">
                       <Image src={url} thumbnail width={80} height={80} style={{ objectFit: 'cover' }} />
                       <CloseButton className="position-absolute top-0 end-0 bg-light rounded-circle p-1 border shadow-sm" style={{ transform: 'translate(30%, -30%)', zIndex: 1 }} onClick={() => handleRemoveImage(url)} />
                     </div>
                   ))}
                 </div>
               )}
              {/* Поле для загрузки новых */} 
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
               {/* Индикаторы загрузки/ошибки */} 
               {uploading && <div className="d-flex align-items-center text-muted mt-2 small"><Spinner size="sm" className="me-2" /> Загрузка...</div>}
               {uploadError && (
                 <Alert variant="danger" className="d-flex align-items-center small p-2 mt-2">
                    {/* Заменяем плейсхолдер на SVG иконку ошибки */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                       <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                    </svg>
                   {uploadError}
                 </Alert>
                )}
             </Form.Group>
            
            {/* API Error */}
            {apiError && (
              <Alert variant="danger" className="d-flex align-items-center small p-2">
                {/* Заменяем плейсхолдер на SVG иконку ошибки */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                 </svg>
                {apiError}
              </Alert>
            )}

            {/* Buttons */} 
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId } })} disabled={mutation.isPending || uploading}>Отмена</Button>
              <Button type="submit" variant="primary" disabled={mutation.isPending || uploading} className="d-flex align-items-center">
                {mutation.isPending ? (<><Spinner size="sm" className="me-2" /> Сохранение...</>) : "Сохранить изменения"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
} 