import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter } from "react-router-dom"
import "./styles/index.css"
import App from "./app/App.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app}
    </ThemeProvider>
  </StrictMode>,
)
