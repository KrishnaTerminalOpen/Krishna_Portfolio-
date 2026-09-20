import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import './index.css'
import App from './App.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import ProjectManager from './ProjectManager.jsx'

const root = createRoot(document.getElementById('root'))

function renderApp() {
  const pathname = window.location.pathname
  const hash = window.location.hash

  const isAnalyticsPage =
    pathname === '/analytics' || hash === '#/analytics'

  const isProjectManagerPage =
    pathname === '/admin/projects' || hash === '#/admin/projects'

  root.render(
    <StrictMode>
      {isAnalyticsPage ? (
        <AnalyticsDashboard />
      ) : isProjectManagerPage ? (
        <ProjectManager />
      ) : (
        <App />
      )}
    </StrictMode>,
  )
}

renderApp()

window.addEventListener('hashchange', renderApp)
window.addEventListener('popstate', renderApp)