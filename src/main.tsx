import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from '@/app/providers/app-provider'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider />
  </React.StrictMode>,
)
