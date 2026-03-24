import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from "@react-oauth/google";

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="444026113468-mhn8566mgflkjgi1jg78rvrh359895u0.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>
  </StrictMode>,
)
