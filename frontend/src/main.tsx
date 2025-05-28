import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from './routes'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  </React.StrictMode>,
)
