import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './StegoDetector.css'
import StegoDetector from './StegoDetector.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StegoDetector />
  </StrictMode>,
)
