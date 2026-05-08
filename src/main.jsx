import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Apply saved theme immediately (before paint) to avoid flash
const saved = localStorage.getItem('signum_theme') || 'dark'
document.documentElement.setAttribute('data-theme', saved)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
