import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './themeContext.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function Root() {
  const inner = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
  return (
    <ThemeProvider>
      {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider> : inner}
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
