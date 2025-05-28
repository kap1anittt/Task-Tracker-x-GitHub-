import { Outlet, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser, logout } from '../api/authApi'

// Вспомогательная функция для SVG иконок (упрощение)
const SvgIcon = ({ d, className = "bi", size = 16 }: { d: string, className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" className={className} viewBox="0 0 16 16">
    <path d={d} />
  </svg>
);

export function Layout() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 минут
  })

  const handleLogout = async () => {
    await logout()
    // Перезагрузка страницы для сброса состояния
    window.location.href = '/'
  }

  return (
    <div className="d-flex flex-column vh-100" style={{ backgroundColor: '#f8f9fa' }}> {/* Основной контейнер */}
      <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm sticky-top border-bottom"> {/* Шапка */}
        <div className="container-fluid"> {/* Используем container-fluid для полной ширины */}
          <Link to="/" className="navbar-brand fw-bold text-primary"> {/* Название */}
            Task Tracker
          </Link>
          
          {/* Кнопка для мобильного меню (если понадобится) */}
          {/* <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
            <span className="navbar-toggler-icon"></span>
          </button> */}

          {/* Навигация */}
          {/* <div className="collapse navbar-collapse" id="navbarContent"> */}
            <nav className="navbar-nav me-auto mb-2 mb-md-0 d-none d-md-flex"> {/* Навигация (скрыта на малых экранах) */}
              <Link 
                to="/" 
                className="nav-link d-flex align-items-center"
                activeProps={{ className: "nav-link active fw-semibold d-flex align-items-center" }}
              >
                <SvgIcon className="bi me-2" size={18} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> {/* Заменить на Bootstrap иконку? */}
                Задачи
              </Link>
              <Link 
                to="/create" 
                className="nav-link d-flex align-items-center"
                activeProps={{ className: "nav-link active fw-semibold d-flex align-items-center" }}
              >
                 <SvgIcon className="bi me-2" size={18} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /> {/* Заменить на Bootstrap иконку? */}
                Создать задачу
              </Link>
            </nav>
          {/* </div> */}

          {/* Правая часть шапки */}
          <div className="d-flex align-items-center ms-auto"> {/* Используем ms-auto для выравнивания вправо */}
            {isLoading ? (
              <div className="d-flex align-items-center text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span className="visually-hidden">Загрузка...</span>
                </div>
                <span className="small">Загрузка...</span>
              </div>
            ) : isError ? (
              <Link 
                to="/login" 
                className="btn btn-primary btn-sm d-flex align-items-center"
              >
                <SvgIcon className="bi me-2" size={18} d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"/> {/* Заменить на Bootstrap иконку? */}
                Войти
              </Link>
            ) : (
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center me-3">
                  <img
                    className="rounded-circle me-2 border border-2 border-secondary-subtle" // Заменил классы Tailwind
                    style={{ width: '32px', height: '32px', objectFit: 'cover' }} // Добавил inline стили для размера
                    src={user?.avatar_url || 'https://avatars.githubusercontent.com/u/1?v=4'}
                    alt={user?.name || 'Пользователь'}
                  />
                  <span className="small fw-medium text-dark d-none d-sm-inline">{user?.name || 'Пользователь'}</span> {/* Скрываем на xs */}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center"
                >
                   <SvgIcon className="bi me-1 d-sm-none" size={16} d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"/> {/* Иконка для sm+ */}
                   <SvgIcon className="bi me-1 d-none d-sm-inline" size={16} d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"/> {/* Иконка для sm+ */}
                  <span className="d-none d-sm-inline">Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Основное содержимое */}
      <main className="container my-4 flex-grow-1"> {/* Используем container, отступы и flex-grow */}
          <Outlet />
      </main>

      {/* Футер */}
      <footer className="bg-light border-top mt-auto py-3 shadow-sm">
        <div className="container">
          <p className="text-center text-muted small mb-0">
            <span className="fw-semibold text-primary">Task Tracker</span>
            <span className="mx-2">|</span>
            Интеграция с GitHub &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
} 