import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter } from "react-router-dom"
import "./styles/index.css"
import App from "./app/App.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
