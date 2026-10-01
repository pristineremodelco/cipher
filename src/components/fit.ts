/**
 * Steps an element's text down in size, through its --fit property, until it
 * sits on one line inside its own width.
 *
 * Measured rather than guessed from a character count, because how much fits
 * depends on the width of the phone, the text size and the answer size chosen,
 * and only the page knows all three. A number is never cut short with an
 * ellipsis: 0.0714285… is a different number, not a shorter one.
 */
export function fitToWidth(element: HTMLElement | null, floor = 0.4): void {
  if (!element) return
  let scale = 1
  element.style.setProperty('--fit', '1')
  while (element.scrollWidth > element.clientWidth + 1 && scale > floor) {
    scale = Math.round((scale - 0.05) * 100) / 100
    element.style.setProperty('--fit', String(scale))
  }
}

/**
 * Calls refit whenever something other than a render changes how wide text
 * is: the window turning or resizing, and a typeface finishing loading, which
 * happens a moment after the first draw for every face but the system one.
 */
export function onReflow(refit: () => void): () => void {
  window.addEventListener('resize', refit)
  document.fonts?.addEventListener?.('loadingdone', refit)
  void document.fonts?.ready.then(refit)
  return () => {
    window.removeEventListener('resize', refit)
    document.fonts?.removeEventListener?.('loadingdone', refit)
  }
}
