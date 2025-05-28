import { getGitHubAuthUrl } from '../api/authApi'
import { Button, Card, Container, Row, Col } from 'react-bootstrap'

export function LoginPage() {
  const handleGitHubLogin = () => {
    // Перенаправление на GitHub для авторизации
    window.location.href = getGitHubAuthUrl()
  }

  // SVG иконка GitHub (встроенная для простоты)
  const GitHubIcon = () => (
    <svg
      className="bi me-2 align-text-bottom"
      width="20" height="20"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
    </svg>
  );

  return (
    <Container className="d-flex flex-column justify-content-center py-5" style={{ minHeight: '80vh' }}>
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6} xl={5}>
          <div className="text-center mb-4">
            <h1 className="h3 mb-1 fw-bold text-primary">
              Вход в Task Tracker
            </h1>
            <p className="text-muted small">
              Подключите свой аккаунт GitHub для доступа
            </p>
          </div>
          
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4 p-md-5">
               <div className="text-center mb-4">
                  <span className="text-muted small">Авторизация через</span>
                </div>
              <Button
                variant="dark" // Используем темную кнопку для GitHub
                size="lg"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={handleGitHubLogin}
              >
                <GitHubIcon />
                Войти через GitHub
              </Button>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm border-secondary-subtle">
            <Card.Body className="p-4">
              <h3 className="h6 mb-3 d-flex align-items-center">
                 {/* Иконка информации Bootstrap */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-info-circle-fill me-2 text-secondary" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.083.082-.38 1.158.287c.172.041.288.108.288.287zm-1.002-4.211a1.002 1.002 0 1 1-2 0 1.002 1.002 0 0 1 2 0"/>
                </svg>
                Как это работает?
              </h3>
              <div className="small text-muted">
                <p className="mb-2">
                  После входа через GitHub вы сможете:
                </p>
                <ul className="list-unstyled ps-3">
                  <li className="mb-1"><span className="me-2">✓</span>Создавать и отслеживать задачи</li>
                  <li className="mb-1"><span className="me-2">✓</span>Связывать задачи с коммитами</li>
                  <li className="mb-1"><span className="me-2">✓</span>Автоматически менять статус задач</li>
                  <li><span className="me-2">✓</span>Накапливать баллы за задачи</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
} 