import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { createTask, uploadFile } from '../api/tasksApi'
import { Form, Button, Card, FloatingLabel, Spinner, Alert, Image, CloseButton } from 'react-bootstrap'

export function CreateTaskPage() {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [observersInput, setObserversInput] = useState('')
  const [reviewersInput, setReviewersInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validated, setValidated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const mutation = useMutation({
    mutationFn: (data: { 
        title: string; 
        assignee: string; 
        description?: string; 
        imageUrls?: string[]; 
        observers?: string[];
        reviewers?: string[];
    }) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate({ to: '/' })
      // TODO: Показать Toast уведомление об успехе (например, с react-toastify)
    },
    onError: (error) => {
      setApiError((error as Error).message || 'Произошла неизвестная ошибка')
      // TODO: Показать Toast уведомление об ошибке
    }
  })
  
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
    // TODO: Возможно, стоит добавить вызов API для удаления файла с сервера?
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    
    setApiError(null);
    setValidated(true);
    
    if (form.checkValidity() === true) {
      const observers = observersInput.split(',').map(s => s.trim()).filter(Boolean);
      const reviewers = reviewersInput.split(',').map(s => s.trim()).filter(Boolean);
      
      mutation.mutate({ title, assignee, description, imageUrls, observers, reviewers })
    }
  };
  
  return (
    <div className="mx-auto" style={{ maxWidth: '600px' }}>
      <div className="mb-4">
        <h2 className="h4 mb-1 d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle-fill me-2 text-primary" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
          </svg>
          Создание новой задачи
        </h2>
        <p className="text-muted small">Заполните форму ниже. Логин GitHub ответственного нужен для привязки коммитов.</p>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <FloatingLabel controlId="taskTitle" label="Название задачи" className="mb-3">
              <Form.Control
                required
                type="text"
                placeholder="Название задачи"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isInvalid={validated && !title.trim()}
              />
              <Form.Control.Feedback type="invalid">
                Пожалуйста, введите название задачи.
              </Form.Control.Feedback>
            </FloatingLabel>
            
            <FloatingLabel controlId="taskDescription" label="Описание (поддерживает Markdown)" className="mb-3">
              <Form.Control
                as="textarea"
                placeholder="Описание (поддерживает Markdown)"
                style={{ height: '150px' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FloatingLabel>
            
            <FloatingLabel controlId="taskAssignee" label="Ответственный (логин GitHub)" className="mb-3">
              <Form.Control
                required
                type="text"
                placeholder="Ответственный (логин GitHub)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                isInvalid={validated && !assignee.trim()}
              />
               <Form.Control.Feedback type="invalid">
                 Пожалуйста, укажите логин GitHub ответственного.
              </Form.Control.Feedback>
            </FloatingLabel>

             <Form.Text className="text-muted d-block mb-3 small">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-info-circle me-1 align-text-bottom" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                Используется для автоматической привязки коммитов и PR.
              </Form.Text>
            
            <FloatingLabel controlId="taskObservers" label="Наблюдатели (логины GitHub через запятую)" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Наблюдатели (логины GitHub через запятую)"
                value={observersInput}
                onChange={(e) => setObserversInput(e.target.value)}
              />
              <Form.Text className="text-muted d-block mt-1 small">
                 Будут получать уведомления об изменениях задачи (пока не реализовано).
              </Form.Text>
            </FloatingLabel>

            <FloatingLabel controlId="taskReviewers" label="Ревьюеры PR (логины GitHub через запятую)" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Ревьюеры PR (логины GitHub через запятую)"
                value={reviewersInput}
                onChange={(e) => setReviewersInput(e.target.value)}
              />
              <Form.Text className="text-muted d-block mt-1 small">
                 Будут автоматически добавляться к PR, связанным с задачей (пока не реализовано).
              </Form.Text>
            </FloatingLabel>

            <Form.Group controlId="taskImages" className="mb-3">
              <Form.Label>Изображения</Form.Label>
              <Form.Control 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={uploading}
              />
              {uploading && (
                <div className="d-flex align-items-center text-muted mt-2 small">
                  <Spinner animation="border" size="sm" className="me-2" /> Загрузка...
                </div>
              )}
              {uploadError && (
                <Alert variant="danger" className="d-flex align-items-center small p-2 mt-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                  </svg>
                  {uploadError}
                </Alert>
              )}
              {imageUrls.length > 0 && (
                <div className="mt-3 d-flex flex-wrap gap-2">
                  {imageUrls.map(url => (
                    <div key={url} className="position-relative">
                      <Image src={url} thumbnail width={80} height={80} style={{ objectFit: 'cover' }} />
                      <CloseButton 
                        className="position-absolute top-0 end-0 bg-light rounded-circle p-1 border shadow-sm" 
                        style={{ transform: 'translate(30%, -30%)', zIndex: 1 }}
                        onClick={() => handleRemoveImage(url)} 
                        aria-label="Удалить изображение"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>

            {apiError && (
              <Alert variant="danger" className="d-flex align-items-center small p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                </svg>
                {apiError}
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button
                variant="outline-secondary"
                onClick={() => navigate({ to: '/' })}
                disabled={mutation.isPending || uploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg me-1 align-baseline" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                </svg>
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={mutation.isPending || uploading}
                className="d-flex align-items-center"
              >
                {mutation.isPending ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Создание...
                  </>
                ) : (
                  <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-lg me-1 align-baseline" viewBox="0 0 16 16">
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093z"/>
                    </svg>
                    Создать задачу
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}