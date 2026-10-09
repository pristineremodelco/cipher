import { parseHex } from './theme'

/**
 * Whether this browser will hand back the colour under a pointer.
 *
 * Chromium has it on a computer. Phones and Safari and Firefox do not, so the
 * button is simply absent there rather than present and broken: an eyedropper
 * that does nothing is worse than none at all.
 */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> }
export function eyeDropper(): EyeDropperCtor | null {
  const ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
  return typeof ctor === 'function' ? ctor : null
}

/** A colour off the screen, or null if there is no eyedropper or it was dismissed. */
export async function pickOffScreen(): Promise<string | null> {
  const Ctor = eyeDropper()
  if (!Ctor) return null
  try {
    const { sRGBHex } = await new Ctor().open()
    return parseHex(sRGBHex)
  } catch {
    return null /* dismissed with Escape, which is not an error */
  }
}
