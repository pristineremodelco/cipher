import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The installed app opens the public site, so the service worker and the
 * update banner stay the ones already on that site. When that site cannot
 * be reached, only one file is shown: offline.html. Its style is inline
 * and the legal text is in the page, because the calculator's scripts and
 * the separate legal files are not loaded with the error page.
 */
const site = 'https://cipher.pristineremodelco.workers.dev'

const config: CapacitorConfig = {
  appId: 'com.pristineremodel.cipher',
  appName: 'Cipher',
  webDir: 'dist',
  server: {
    url: site,
    errorPath: 'offline.html',
    androidScheme: 'https',
    hostname: 'localhost',
    // The fallback copy is served from localhost. Without this, a tap inside
    // that copy would leave the app, because only the site itself is the app.
    allowNavigation: ['localhost'],
  },
  android: {
    backgroundColor: '#241C13',
  },
  // The stock handler goes back in the web view and then swallows the button,
  // so the activity never finishes. MainActivity owns the button instead.
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
  },
}

export default config
