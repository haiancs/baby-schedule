import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CloudContext, cloud } from './cloudContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CloudContext.Provider value={cloud}>
      <App />
    </CloudContext.Provider>
  </StrictMode>,
)
