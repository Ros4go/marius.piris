import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/persona.css'
import App from './App.jsx'
import { installReloadOnPreloadError } from './core/lazy.js'

installReloadOnPreloadError()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
