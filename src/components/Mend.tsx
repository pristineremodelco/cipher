import { Component, type ReactNode } from 'react'
import { forgetSettings } from '../lib/storage'

type Props = { children: ReactNode; whole?: boolean }

/**
 * What shows instead of a blank page if something throws while drawing.
 *
 * Around a tool it offers to start that tool again and leaves the rest of the
 * app standing. Around everything it offers a reload and, in case it is
 * something stored that keeps tripping it, a way to put the settings back.
 */
export class Mend extends Component<Props, { broken: boolean; fetch: boolean }> {
  state = { broken: false, fetch: false }

  /**
   * A screen that failed to download is remembered as failed by the browser's
   * module loader, so drawing it again only fails again: that one needs the
   * page reloaded, most often after an update has replaced the file.
   */
  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { broken: true, fetch: /dynamically imported module|module script|loading chunk|failed to fetch/i.test(message) }
  }

  render() {
    if (!this.state.broken) return this.props.children
    if (!this.props.whole) {
      return (
        <div className="offline" role="alert">
          <strong>This screen hit a snag</strong>
          <button className="ghost" onClick={() => (this.state.fetch ? location.reload() : this.setState({ broken: false }))}>
            Start it again
          </button>
        </div>
      )
    }
    return (
      <div className="offline mend-whole" role="alert">
        <strong>Cipher hit a snag</strong>
        <p>History is kept either way.</p>
        <button className="ghost" onClick={() => location.reload()}>
          Reload
        </button>
        <button
          className="ghost"
          onClick={() => {
            forgetSettings()
            location.reload()
          }}
        >
          Reload with settings put back
        </button>
      </div>
    )
  }
}
