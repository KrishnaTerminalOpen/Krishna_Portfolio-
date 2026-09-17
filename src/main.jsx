import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import './index.css'
import App from './App.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'

const isAnalyticsPage = window.location.pathname === '/analytics'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAnalyticsPage ? <AnalyticsDashboard /> : <App />}
  </StrictMode>,
)