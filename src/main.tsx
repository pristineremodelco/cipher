import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './SettingsProvider.tsx'
import { Mend } from './components/Mend.tsx'
import { UpdateBanner } from './components/UpdateBanner.tsx'
import { offerUpdate, watchForUpdates } from './update.ts'

// A new version has installed itself and taken over; the page on screen is
// still the old one. Rather than reloading under someone halfway through a
// sum, which is what would happen by default, the banner offers the reload.
registerSW({
  immediate: true,
  onNeedReload: () => offerUpdate(async () => location.reload()),
  onRegisteredSW: (_url, registration) => {
    if (registration) watchForUpdates(registration)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Mend whole>
      <SettingsProvider>
        <App />
        <UpdateBanner />
      </SettingsProvider>
    </Mend>
  </StrictMode>,
)
