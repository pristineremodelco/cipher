import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The installed app opens the public site, so the service worker and the
 * update banner stay the ones already on that site. `dist` is only what
 * shows when the site cannot be reached: the same root build, served from
 * this app. A folder build such as GitHub Pages would not match those paths.
 */
const site = 'https://cipher.pristineremodelco.workers.dev'

const config: CapacitorConfig = {
  appId: 'com.pristineremodel.cipher',
  appName: 'Cipher',
  webDir: 'dist',
  server: {
    url: site,
    errorPath: 'index.html',
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
