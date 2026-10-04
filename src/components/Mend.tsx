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
export class Mend extends Component<Props, { broken: boolean }> {
  state = { broken: false }

  static getDerivedStateFromError() {
    return { broken: true }
  }

  render() {
    if (!this.state.broken) return this.props.children
    if (!this.props.whole) {
      return (
        <div className="offline" role="alert">
          <strong>This screen hit a snag</strong>
          <button className="ghost" onClick={() => this.setState({ broken: false })}>
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
