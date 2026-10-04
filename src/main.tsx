import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './SettingsProvider.tsx'
import { Mend } from './components/Mend.tsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Mend whole>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </Mend>
  </StrictMode>,
)
