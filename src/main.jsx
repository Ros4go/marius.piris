import React from 'react'
import { createRoot } from 'react-dom/client'
import './design/persona.css'
import './design/legacy.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
