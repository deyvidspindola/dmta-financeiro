import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/theme.css'
import { applyTheme, useThemeStore } from '@/store/themeStore'

// Aplica o tema antes do primeiro paint do React (o index.html já fez a
// primeira pincelada pra evitar flash; aqui garantimos o estado do store).
applyTheme(useThemeStore.getState().pref)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
