/**
 * The Android shell injects window.Capacitor. On the site in a browser it is
 * absent, and these fall through to the web platform.
 */
type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  Plugins?: {
    Clipboard?: { write: (options: { string: string }) => Promise<void> }
    Share?: { share: (options: { title?: string; text?: string; dialogTitle?: string }) => Promise<unknown> }
  }
}

function bridge(): CapacitorGlobal | undefined {
  return (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor
}

export function isNativeApp(): boolean {
  return bridge()?.isNativePlatform?.() === true
}

export async function copyText(text: string): Promise<void> {
  const clipboard = bridge()?.Plugins?.Clipboard
  if (isNativeApp() && clipboard) {
    await clipboard.write({ string: text })
    return
  }
  await navigator.clipboard.writeText(text)
}

export async function shareText(text: string): Promise<void> {
  const share = bridge()?.Plugins?.Share
  if (isNativeApp() && share) {
    await share.share({ title: 'Cipher', text, dialogTitle: 'Share' })
    return
  }
  await navigator.share({ title: 'Cipher', text })
}
